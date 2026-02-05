from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Lead, Conversation, SystemLog

router = APIRouter()

@router.get("/leads")
def read_leads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    leads = db.query(Lead).order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return leads

@router.get("/conversations")
def read_conversations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(Conversation.last_message_at.desc()).offset(skip).limit(limit).all()
    return conversations

@router.get("/conversations/{reddit_username}")
def read_conversation(reddit_username: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.reddit_username == reddit_username).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.post("/conversations/{reddit_username}/takeover")
def toggle_takeover(reddit_username: str, enable: bool, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.reddit_username == reddit_username).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.human_takeover = enable
    db.commit()
    return {"status": "success", "human_takeover": enable}

@router.get("/logs")
def read_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return logs

@router.post("/collector/lead")
def collect_lead(data: dict, db: Session = Depends(get_db)):
    # Try to find existing lead
    existing = db.query(Lead).filter(Lead.reddit_id == data['id']).first()
    if existing:
        return {"status": "skipped", "id": data['id']}
    
    lead = Lead(
        reddit_id=data['id'],
        title=data['title'],
        body=data['body'],
        subreddit=data['subreddit'],
        author=data['author'],
        url=data['url'],
        score=data.get('score', 0)
    )
    db.add(lead)
    db.commit()
    return {"status": "success", "id": data['id']}

@router.post("/collector/conversation")
def collect_conversation(data: dict, db: Session = Depends(get_db)):
    # Find or create conversation
    convo = db.query(Conversation).filter(Conversation.reddit_username == data['username']).first()
    if not convo:
        convo = Conversation(reddit_username=data['username'])
        db.add(convo)
    
    convo.last_message = data['last_message']
    convo.history = data['history'] # Expected to be stringified JSON
    convo.last_message_at = data['timestamp']
    db.commit()
    return {"status": "success"}

