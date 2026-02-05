import os
import random
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("system.log"),
        logging.StreamHandler()
    ]
)

def get_logger(name):
    return logging.getLogger(name)

def get_random_interval():
    """
    Returns a weighted random interval in seconds.
    70% chance: 5-8 mins (300-480s)
    20% chance: 3-5 mins (180-300s)
    10% chance: 8-12 mins (480-720s)
    """
    rand = random.random()
    if rand < 0.7:
        return random.randint(300, 480)
    elif rand < 0.9:
        return random.randint(180, 300)
    else:
        return random.randint(480, 720)

config = {
    "REDDIT_CLIENT_ID": os.getenv("REDDIT_CLIENT_ID"),
    "REDDIT_CLIENT_SECRET": os.getenv("REDDIT_CLIENT_SECRET"),
    "REDDIT_REFRESH_TOKEN": os.getenv("REDDIT_REFRESH_TOKEN"),
    "REDDIT_USERNAME": os.getenv("REDDIT_USERNAME"),
    "GOOGLE_AI_API_KEY": os.getenv("GOOGLE_AI_API_KEY"),
    "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
    "DISCORD_WEBHOOK_URL": os.getenv("DISCORD_WEBHOOK_URL"),
}
