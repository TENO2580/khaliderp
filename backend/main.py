from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
from crawler.engine import run_crawler, check_scheduled_crawls
import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Competitor Intelligence API")
scheduler = AsyncIOScheduler()

@app.on_event("startup")
def start_scheduler():
    logger.info("Starting APScheduler")
    # Check for scheduled crawls every hour
    scheduler.add_job(check_scheduled_crawls, "interval", hours=1)
    scheduler.start()

@app.on_event("shutdown")
def stop_scheduler():
    logger.info("Shutting down APScheduler")
    scheduler.shutdown()

class AnalyzeRequest(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    company_id: str # ID from Next.js Prisma DB

@app.get("/api/debug")
async def debug_db():
    from crawler.engine import get_db_connection
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            return {"status": "success"}
        return {"status": "failed", "error": "conn is None"}
    except Exception as e:
        import traceback
        return {"status": "exception", "error": str(e), "traceback": traceback.format_exc()}

@app.post("/api/analyze")
async def analyze_company(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    # This endpoint receives a request from Next.js, and starts the background crawling
    # The actual db insert/update will be handled via Prisma directly or by the crawler inserting into PostgreSQL.
    
    background_tasks.add_task(
        run_crawler,
        company_id=req.company_id,
        company_name=req.company_name,
        website=req.website,
        industry=req.industry,
        country=req.country
    )
    
    return {"status": "started", "company_id": req.company_id, "message": "Crawling started in background"}

@app.get("/api/status/{company_id}")
async def get_status(company_id: str):
    # Status can just be checked via the Next.js DB, but we provide this endpoint for completeness
    return {"company_id": company_id, "status": "processing"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
