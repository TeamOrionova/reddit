import praw
import time
import requests
from database import SessionLocal, Lead
from ai_client import ai_client
from utils import get_logger, config

logger = get_logger(__name__)

SUBREDDITS = [
    "sales", "remote_sales", "freelance_sales", "salesjobs", 
    "sidehustle", "marketing", "entrepreneur", "remote",
    "workfromhome", "jobbit"
]

KEYWORDS = [
    "commission", "sales", "remote work", "freelance", 
    "side hustle", "earn money", "work from home", "closer", "appointment setter"
]

def get_reddit_client():
    if not config.get("REDDIT_CLIENT_ID"):
        return None
    username = config["REDDIT_USERNAME"] or "unknown_user"
    user_agent = f"web:SalesAutomation:v1.0.0 (by /u/{username})"
    
    return praw.Reddit(
        client_id=config["REDDIT_CLIENT_ID"],
        client_secret=config["REDDIT_CLIENT_SECRET"],
        refresh_token=config["REDDIT_REFRESH_TOKEN"],
        user_agent=user_agent,
        username=config["REDDIT_USERNAME"]
    )

def send_discord_notification(lead):
    webhook_url = config.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return
    
    data = {
        "content": f"🚨 **New Lead Detected!**\n**Subreddit:** r/{lead.subreddit}\n**Title:** {lead.title}\n**URL:** {lead.url}\n**Score:** {lead.score}"
    }
    try:
        requests.post(webhook_url, json=data)
    except Exception as e:
        logger.error(f"Failed to send Discord notification: {e}")

def check_leads():
    logger.info("Checking for new leads...")
    reddit = get_reddit_client()
    if not reddit:
        logger.warning("Reddit credentials not configured.")
        return

    db = SessionLocal()
    try:
        # Combine subreddits into a multi-reddit string
        sub_string = "+".join(SUBREDDITS)
        # Verify read_only mode or not, usually read_only is fine for reading
        # But we authenticated with refresh token, so we are authenticated user
        
        for submission in reddit.subreddit(sub_string).new(limit=20):
            # Check if exists
            exists = db.query(Lead).filter(Lead.reddit_id == submission.id).first()
            if exists:
                continue

            # Basic Keyword Matching
            title_text = submission.title.lower()
            body_text = submission.selftext.lower()
            full_text = title_text + " " + body_text
            
            flagged = any(keyword in full_text for keyword in KEYWORDS)
            
            if flagged:
                logger.info(f"New lead found: {submission.title}")
                
                # AI Scoring
                # analysis = ai_client.score_lead(submission.title, submission.selftext)
                # simple score for now
                score = 80 # Placeholder
                
                new_lead = Lead(
                    reddit_id=submission.id,
                    title=submission.title,
                    body=submission.selftext,
                    subreddit=submission.subreddit.display_name,
                    url=submission.url,
                    author=str(submission.author),
                    score=score,
                    status="new"
                )
                db.add(new_lead)
                db.commit()
                
                send_discord_notification(new_lead)

    except Exception as e:
        logger.error(f"Error checking leads: {e}")
    finally:
        db.close()
