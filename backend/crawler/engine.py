import asyncio
import os
import json
from datetime import datetime, timezone
from playwright.async_api import async_playwright
import trafilatura
from sqlalchemy import create_engine, text
from urllib.parse import urlparse
from crawler.extractor import extract_seo_and_tech
from crawler.ai_analyzer import analyze_company_with_ai
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("WARNING: DATABASE_URL not set in .env")

# We will use SQLAlchemy to update the DB directly from python
def get_db_connection():
    # Convert prisma postgresql:// to sqlalchemy postgresql://
    # E.g. postgresql://user:pass@host/db
    if not DATABASE_URL:
        return None
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    # Handle pgbouncer/transaction mode if directUrl is needed, but we'll try the main one
    direct_url = os.environ.get("DIRECT_URL", url)
    if direct_url.startswith("postgres://"):
        direct_url = direct_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(direct_url)
    return engine.connect()

async def get_website_html(url: str):
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, timeout=30000)
            html = await page.content()
            await browser.close()
            return html
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

async def run_crawler(company_id: str, company_name: str, website: str, industry: str, country: str):
    print(f"Starting crawl for {company_name} ({company_id})")
    conn = None
    try:
        conn = get_db_connection()
        if conn:
            # Update status to CRAWLING
            conn.execute(text("UPDATE ci_companies SET status = 'CRAWLING', \"updatedAt\" = :now WHERE id = :id"), {"id": company_id, "now": datetime.now(timezone.utc)})
            conn.commit()
            
        # 1. Fetch website HTML
        html = None
        main_text = ""
        seo_data = {}
        tech_stack = []
        if website:
            if not website.startswith('http'):
                website = 'https://' + website
            html = await get_website_html(website)
            if html:
                # Extract text using trafilatura
                main_text = trafilatura.extract(html) or ""
                # Extract SEO and Tech Stack using BeautifulSoup
                seo_data, tech_stack = extract_seo_and_tech(html, website)
                
        # 2. Use AI to extract products, competitors, swot
        # We pass the text and metadata to Ollama (or a mock if it fails)
        ai_results = await analyze_company_with_ai(company_name, industry, main_text, website)
        
        if conn:
            # 3. Update the database with results
            # Company Profile
            conn.execute(
                text("""
                UPDATE ci_companies 
                SET overview = :overview, "businessModel" = :bm, "targetCustomers" = :tc, 
                    "estimatedSize" = :es, "marketPosition" = :mp, status = 'COMPLETED', "updatedAt" = :now 
                WHERE id = :id
                """),
                {
                    "overview": ai_results.get("overview", "Generated overview not available."),
                    "bm": ai_results.get("businessModel", "B2B/B2C"),
                    "tc": ai_results.get("targetCustomers", "General"),
                    "es": ai_results.get("estimatedSize", "Unknown"),
                    "mp": ai_results.get("marketPosition", "Unknown"),
                    "now": datetime.now(timezone.utc),
                    "id": company_id
                }
            )
            
            # SWOT
            swot = ai_results.get("swot", {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []})
            swot_id = f"swot_{company_id}"
            conn.execute(
                text("""
                INSERT INTO ci_swot_analysis (id, "companyId", strengths, weaknesses, opportunities, threats)
                VALUES (:id, :cid, :s, :w, :o, :t)
                ON CONFLICT ("companyId") DO UPDATE 
                SET strengths = EXCLUDED.strengths, weaknesses = EXCLUDED.weaknesses, 
                    opportunities = EXCLUDED.opportunities, threats = EXCLUDED.threats
                """),
                {
                    "id": swot_id,
                    "cid": company_id,
                    "s": json.dumps(swot.get("strengths", [])),
                    "w": json.dumps(swot.get("weaknesses", [])),
                    "o": json.dumps(swot.get("opportunities", [])),
                    "t": json.dumps(swot.get("threats", []))
                }
            )
            
            # Products
            for prod in ai_results.get("products", []):
                import uuid
                pid = str(uuid.uuid4())
                conn.execute(
                    text("""
                    INSERT INTO ci_company_products (id, "companyId", name, description, features)
                    VALUES (:id, :cid, :n, :d, :f)
                    """),
                    {
                        "id": pid,
                        "cid": company_id,
                        "n": prod.get("name", "Unknown Product"),
                        "d": prod.get("description", ""),
                        "f": prod.get("features", "")
                    }
                )
                
            # SEO
            if seo_data:
                seo_id = f"seo_{company_id}"
                conn.execute(
                    text("""
                    INSERT INTO ci_seo_analysis (id, "companyId", title, "metaDescription", keywords, "h1Count", "internalLinks", "externalLinks", "schemaPresent", "blogCount", score)
                    VALUES (:id, :cid, :t, :md, :k, :h1, :il, :el, :sp, :bc, :s)
                    ON CONFLICT ("companyId") DO UPDATE
                    SET title = EXCLUDED.title, "metaDescription" = EXCLUDED."metaDescription"
                    """),
                    {
                        "id": seo_id,
                        "cid": company_id,
                        "t": seo_data.get("title", ""),
                        "md": seo_data.get("metaDescription", ""),
                        "k": seo_data.get("keywords", ""),
                        "h1": seo_data.get("h1Count", 0),
                        "il": seo_data.get("internalLinks", 0),
                        "el": seo_data.get("externalLinks", 0),
                        "sp": seo_data.get("schemaPresent", False),
                        "bc": 0,
                        "s": seo_data.get("score", 0.0)
                    }
                )
            conn.commit()
            print(f"Finished crawling and updating DB for {company_name}")

    except Exception as e:
        print(f"Crawl failed for {company_id}: {e}")
        if conn:
            conn.execute(text("UPDATE ci_companies SET status = 'FAILED', \"updatedAt\" = :now WHERE id = :id"), {"id": company_id, "now": datetime.now(timezone.utc)})
            conn.commit()
    finally:
        if conn:
            conn.close()
