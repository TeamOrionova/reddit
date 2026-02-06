import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from api import router
from monitor import check_leads
from dm_handler import check_dms
from scheduler import check_scheduled_posts
from utils import get_random_interval, get_logger

logger = get_logger("main")

# Background tasks
async def background_monitor():
    while True:
        try:
            logger.info("Starting monitor check...")
            check_leads() # Using synchronous version, potentially blocking if not using async praw or threading
            # For this value demo, blocking is acceptable in a background thread/task if concise
        except Exception as e:
            logger.error(f"Error in monitor loop: {e}")
        
        interval = get_random_interval()
        logger.info(f"Monitor sleeping for {interval} seconds")
        await asyncio.sleep(interval)

async def background_dm_check():
    while True:
        try:
            check_dms()
        except Exception as e:
            logger.error(f"Error in DM loop: {e}")
        await asyncio.sleep(60) # Check DMs every minute

async def background_scheduler():
    while True:
        try:
            check_scheduled_posts()
        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
        await asyncio.sleep(3600) # Check scheduler every hour

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    init_db()
    
    # We are using Devvit for the actual Reddit monitoring and DMs.
    # The Python backend now serves as the Dashboard & Data Collector API only.
    # This prevents the "Credentials not configured" error on Render.
    
    # logger.info("Background tasks disabled (handled by Devvit)")
    # asyncio.create_task(background_monitor())
    # asyncio.create_task(background_dm_check())
    # asyncio.create_task(background_scheduler())
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

# CORS configuration: Allow all for easy testing on Render/Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
# Fallback so both /api/leads and /leads work (common deployment mistake)
app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Reddit Automation Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
