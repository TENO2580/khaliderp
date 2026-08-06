from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_seo_and_tech(html_content: str, base_url: str):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. SEO Data
    title = soup.title.string if soup.title else ""
    meta_desc = ""
    keywords = ""
    
    for meta in soup.find_all('meta'):
        if meta.get('name', '').lower() == 'description':
            meta_desc = meta.get('content', '')
        if meta.get('name', '').lower() == 'keywords':
            keywords = meta.get('content', '')
            
    h1_count = len(soup.find_all('h1'))
    
    links = soup.find_all('a', href=True)
    internal_links = 0
    external_links = 0
    for link in links:
        href = link['href']
        if href.startswith('/') or base_url in href:
            internal_links += 1
        elif href.startswith('http'):
            external_links += 1
            
    schema_present = False
    for script in soup.find_all('script', type='application/ld+json'):
        schema_present = True
        break
        
    seo_data = {
        "title": title[:255] if title else "",
        "metaDescription": meta_desc[:500] if meta_desc else "",
        "keywords": keywords[:255] if keywords else "",
        "h1Count": h1_count,
        "internalLinks": internal_links,
        "externalLinks": external_links,
        "schemaPresent": schema_present,
        "score": 85.5 # Mock score based on basic checks
    }
    
    # 2. Tech Stack Detection
    tech_stack = []
    # Check for common frameworks in scripts
    scripts_src = [s.get('src', '').lower() for s in soup.find_all('script') if s.get('src')]
    if any('react' in s or '_next' in s for s in scripts_src):
        tech_stack.append({"category": "Framework", "name": "React / Next.js"})
    if any('wp-content' in s or 'wp-includes' in s for s in scripts_src) or soup.find('link', href=lambda h: h and 'wp-content' in h):
        tech_stack.append({"category": "CMS", "name": "WordPress"})
    
    return seo_data, tech_stack
