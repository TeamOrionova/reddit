import praw
import requests
import json
from datetime import datetime
from database import SessionLocal, Conversation
from ai_client import ai_client
from rag import rag_system
from monitor import get_reddit_client
from utils import get_logger, config

logger = get_logger(__name__)

def send_dm_notification(username, message, reply):
    webhook_url = config.get("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return
    
    data = {
        "content": f"💬 **New DM from u/{username}**\n\n**User:** {message}\n\n**AI Reply:** {reply}"
    }
    try:
        requests.post(webhook_url, json=data)
    except Exception as e:
        logger.error(f"Failed to send Discord DM notification: {e}")

def check_dms():
    logger.info("Checking DMs...")
    reddit = get_reddit_client()
    if not reddit:
        return

    db = SessionLocal()
    try:
        for message in reddit.inbox.unread(limit=10):
            # Check if it's a DM (not comment reply)
            if not isinstance(message, praw.models.Message):
                message.mark_read() # Mark comment replies as read or handle differently
                continue
                
            sender = str(message.author)
            logger.info(f"Processing DM from {sender}")
            
            # Get or create conversation
            conversation = db.query(Conversation).filter(Conversation.reddit_username == sender).first()
            if not conversation:
                conversation = Conversation(
                    reddit_username=sender,
                    messages=[],
                    status="new"
                )
                db.add(conversation)
                db.commit()
            
            if conversation.human_takeover:
                logger.info(f"Skipping auto-reply for {sender} (Human Takeover)")
                # Optionally mark read so we don't process again, but user needs to see it? 
                # If we mark read, we won't see it in unread.
                # Usually we want to ingest it into DB message history but not reply.
                msg_history = list(conversation.messages) if conversation.messages else []
                msg_history.append({"role": "user", "content": message.body, "timestamp": str(datetime.utcnow())})
                conversation.messages = msg_history
                db.commit()
                message.mark_read()
                send_dm_notification(sender, message.body, "[Human Takeover Active - No AI Reply]")
                continue

            # RAG Retrieval
            context_docs = rag_system.retrieve(message.body)
            context_text = "\n\n".join(context_docs)
            
            # Generate AI Response
            response_text = ai_client.generate_response(message.body, context=context_text)
            
            # Append Footer for Compliance
            response_text += "\n\n*(This is an automated message by /u/" + config["REDDIT_USERNAME"] + "'s AI assistant)*"
            
            # Send Reply
            try:
                message.reply(response_text)
                message.mark_read()
                
                # Update DB
                msg_history = list(conversation.messages) if conversation.messages else []
                msg_history.append({"role": "user", "content": message.body, "timestamp": str(datetime.utcnow())})
                msg_history.append({"role": "assistant", "content": response_text, "timestamp": str(datetime.utcnow())})
                conversation.messages = msg_history
                conversation.last_message_at = datetime.utcnow()
                conversation.status = "engaged"
                db.commit()
                
                send_dm_notification(sender, message.body, response_text)
                
            except Exception as e:
                logger.error(f"Failed to reply to {sender}: {e}")
                
    except Exception as e:
        logger.error(f"Error handling DMs: {e}")
    finally:
        db.close()
