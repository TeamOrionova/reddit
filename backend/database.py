from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./data/leadstore.sqlite"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    reddit_id = Column(String, unique=True, index=True)
    title = Column(String)
    body = Column(Text)
    subreddit = Column(String)
    url = Column(String)
    author = Column(String)
    score = Column(Float, default=0.0)
    status = Column(String, default="new")  # new, ignored, contacted, bookmarked
    created_at = Column(DateTime, default=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    reddit_username = Column(String, unique=True, index=True)
    status = Column(String, default="new")  # new, engaged, qualified, closed
    last_message_at = Column(DateTime, default=datetime.utcnow)
    messages = Column(JSON, default=list) # List of {role: "user"|"assistant", content: "..."}
    human_takeover = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

class PostTemplate(Base):
    __tablename__ = "post_templates"
    id = Column(Integer, primary_key=True, index=True)
    title_template = Column(String)
    body_template = Column(Text)
    subreddit = Column(String)
    last_used = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String)  # INFO, WARNING, ERROR
    module = Column(String) # monitor, dm_handler, scheduler
    message = Column(Text)

class Settings(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True)
    value = Column(JSON)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
