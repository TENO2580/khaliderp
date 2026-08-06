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
    if not DATABASE_URL:
        return None
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    direct_url = os.environ.get("DIRECT_URL", url)
    if direct_url.startswith("postgres://"):
        direct_url = direct_url.replace("postgres://", "postgresql://", 1)
        
    import urllib.parse
    parsed = urllib.parse.urlparse(direct_url)
    query = urllib.parse.parse_qs(parsed.query)
    query.pop('pgbouncer', None)
    if 'supabase.com' in parsed.hostname:
        query['sslmode'] = ['require']
    new_query = urllib.parse.urlencode(query, doseq=True)
    direct_url = parsed._replace(query=new_query).geturl()

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
            
            financial = ai_results.get("financial", {})
            
            # Company Profile & Financials
            conn.execute(
                text("""
                UPDATE ci_companies 
                SET overview = :overview, "businessModel" = :bm, "targetCustomers" = :tc, 
                    "estimatedSize" = :es, "marketPosition" = :mp, 
                    "revenueRange" = :rr, "employeesCount" = :ec, "fundingNews" = :fn, "acquisitions" = :acq,
                    "lastCrawledAt" = :now, status = 'COMPLETED', "updatedAt" = :now 
                WHERE id = :id
                """),
                {
                    "overview": ai_results.get("overview", "Generated overview not available."),
                    "bm": ai_results.get("businessModel", "B2B/B2C"),
                    "tc": ai_results.get("targetCustomers", "General"),
                    "es": ai_results.get("estimatedSize", "Unknown"),
                    "mp": ai_results.get("marketPosition", "Unknown"),
                    "rr": financial.get("revenueRange"),
                    "ec": financial.get("employeesCount"),
                    "fn": financial.get("fundingNews"),
                    "acq": financial.get("acquisitions"),
                    "now": datetime.now(timezone.utc),
                    "id": company_id
                }
            )
            
            import uuid
            
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
            
            # Products & Pricing History
            for prod in ai_results.get("products", []):
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
                est_price = prod.get("estimatedPrice")
                if est_price:
                    # Clean price
                    price_val = 0.0
                    import re
                    match = re.search(r'\d+\.?\d*', est_price)
                    if match:
                        price_val = float(match.group(0))
                    
                    conn.execute(text("""
                        INSERT INTO ci_product_price_history (id, "productId", "companyId", price)
                        VALUES (:id, :pid, :cid, :price)
                    """), {"id": str(uuid.uuid4()), "pid": pid, "cid": company_id, "price": price_val})

            # Marketing
            mkt = ai_results.get("marketing", {})
            if mkt:
                conn.execute(text("""
                    INSERT INTO ci_marketing_intelligence (id, "companyId", campaigns, "contentFreq", "leadMagnets", "referralProgram", "loyaltyProgram", "adLandingPages")
                    VALUES (:id, :cid, :c, :cf, :lm, :rp, :lp, :alp)
                    ON CONFLICT ("companyId") DO UPDATE SET campaigns = EXCLUDED.campaigns, "contentFreq" = EXCLUDED."contentFreq", "leadMagnets" = EXCLUDED."leadMagnets"
                """), {
                    "id": str(uuid.uuid4()), "cid": company_id,
                    "c": json.dumps(mkt.get("campaigns", [])),
                    "cf": mkt.get("contentFreq", ""),
                    "lm": json.dumps(mkt.get("leadMagnets", [])),
                    "rp": mkt.get("referralProgram", False),
                    "lp": False,
                    "alp": "[]"
                })

            # Customer Intelligence
            cust = ai_results.get("customer", {})
            if cust:
                conn.execute(text("""
                    INSERT INTO ci_customer_intelligence (id, "companyId", "sentimentScore", "topComplaints", "topCompliments", "trendingTopics", "wordCloud")
                    VALUES (:id, :cid, :ss, :tcomp, :tcompl, :tt, :wc)
                    ON CONFLICT ("companyId") DO UPDATE SET "sentimentScore" = EXCLUDED."sentimentScore", "topComplaints" = EXCLUDED."topComplaints", "topCompliments" = EXCLUDED."topCompliments"
                """), {
                    "id": str(uuid.uuid4()), "cid": company_id,
                    "ss": cust.get("sentimentScore", 50.0),
                    "tcomp": json.dumps(cust.get("topComplaints", [])),
                    "tcompl": json.dumps(cust.get("topCompliments", [])),
                    "tt": "[]",
                    "wc": ""
                })

            # Gap Analysis
            gap = ai_results.get("gapAnalysis", {})
            if gap:
                conn.execute(text("""
                    INSERT INTO ci_gap_analysis (id, "companyId", "missingFeatures", "pricingDifferences", "marketingGaps", recommendations, "updatedAt")
                    VALUES (:id, :cid, :mf, :pd, :mg, :r, :now)
                    ON CONFLICT ("companyId") DO UPDATE SET "missingFeatures" = EXCLUDED."missingFeatures", recommendations = EXCLUDED.recommendations, "updatedAt" = EXCLUDED."updatedAt"
                """), {
                    "id": str(uuid.uuid4()), "cid": company_id,
                    "mf": json.dumps(gap.get("missingFeatures", [])),
                    "pd": "N/A",
                    "mg": gap.get("marketingGaps", "None"),
                    "r": json.dumps(gap.get("recommendations", [])),
                    "now": datetime.now(timezone.utc)
                })
                
            # Strategies
            strats = ai_results.get("strategies", {})
            for stype, sval in strats.items():
                conn.execute(text("""
                    INSERT INTO ci_ai_strategies (id, "companyId", type, strategy) VALUES (:id, :cid, :t, :s)
                """), {"id": str(uuid.uuid4()), "cid": company_id, "t": stype.upper(), "s": sval})
                
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

async def check_scheduled_crawls():
    """Scheduled task to poll the DB and automatically run crawlers."""
    print("Checking for scheduled crawls...")
    conn = None
    try:
        conn = get_db_connection()
        if not conn: return
        
        companies = conn.execute(text("SELECT id, name, website, industry, country, \"crawlSchedule\", \"lastCrawledAt\" FROM ci_companies WHERE \"crawlSchedule\" != 'NONE'")).fetchall()
        
        now = datetime.now(timezone.utc)
        for c in companies:
            c_id = c[0]
            name = c[1]
            website = c[2]
            ind = c[3]
            country = c[4]
            schedule = c[5]
            last_crawled = c[6] if c[6] else datetime.min.replace(tzinfo=timezone.utc)
            
            delta = now - last_crawled
            should_run = False
            
            if schedule == 'DAILY' and delta.days >= 1:
                should_run = True
            elif schedule == 'WEEKLY' and delta.days >= 7:
                should_run = True
            elif schedule == 'MONTHLY' and delta.days >= 30:
                should_run = True
                
            if should_run:
                print(f"Triggering scheduled crawl for {name}")
                asyncio.create_task(run_crawler(c_id, name, website, ind, country))
                
    except Exception as e:
        print(f"Error checking scheduled crawls: {e}")
    finally:
        if conn:
            conn.close()
