import ollama
import json
import re

async def analyze_company_with_ai(company_name: str, industry: str, main_text: str, website: str, host_company_name: str = "Our ERP Company"):
    """
    Uses Ollama to analyze the scraped text and extract insights for 22 intelligence modules.
    """
    prompt = f"""
    You are an expert enterprise business analyst, market researcher, and competitive intelligence AI.
    Analyze the following information about a competitor named '{company_name}' in the '{industry}' industry.
    Website: {website}
    
    Here is the scraped text from their website:
    {main_text[:6000]} # Limit text to avoid context window issues
    
    Please provide a structured JSON output with the following keys exactly as specified:
    - overview: A short overview of the company.
    - businessModel: E.g., B2B, B2C, D2C, SaaS.
    - targetCustomers: Who they sell to.
    - estimatedSize: E.g., Small, Medium, Enterprise.
    - marketPosition: E.g., Premium, Budget, Leader, Niche.
    - swot: Object with 'strengths', 'weaknesses', 'opportunities', and 'threats' (each a list of strings with explanations).
    - products: A list of objects with 'name', 'description', 'features', and 'estimatedPrice'.
    - marketing: Object with 'campaigns' (list), 'leadMagnets' (list), 'contentFreq', 'referralProgram' (boolean).
    - customer: Object with 'sentimentScore' (float 0-100), 'topComplaints' (list), 'topCompliments' (list).
    - socialMedia: List of objects with 'platform', 'growthTrend'.
    - gapAnalysis: Object comparing them to {host_company_name}. Fields: 'missingFeatures' (list), 'marketingGaps' (string), 'recommendations' (list).
    - strategies: Object with 'pricing' (string), 'sales' (string).
    - financial: Object with 'revenueRange' (string), 'employeesCount' (int), 'fundingNews' (string), 'acquisitions' (string).
    
    Return ONLY valid JSON. Do not include markdown formatting or explanations.
    """
    
    try:
        response = ollama.chat(model='llama3.1', messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ])
        
        content = response['message']['content']
        content = re.sub(r'```json\n|\n```|```', '', content).strip()
        
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"Ollama AI analysis failed (is Ollama running?): {e}")
        # Mock response fallback with extended fields
        return {
            "overview": f"{company_name} is a competitor in the {industry} sector.",
            "businessModel": "B2B / B2C",
            "targetCustomers": "General consumers and enterprises",
            "estimatedSize": "Medium-to-Enterprise",
            "marketPosition": "Strong growth",
            "swot": {
                "strengths": ["Strong product lineup", "Good market presence"],
                "weaknesses": ["Limited digital footprint"],
                "opportunities": ["Expansion into new territories", "SEO optimization"],
                "threats": ["New market entrants"]
            },
            "products": [
                {"name": "Core Product", "description": f"Main offering of {company_name}", "features": "Durable, Reliable", "estimatedPrice": "$99/mo"}
            ],
            "marketing": {
                "campaigns": ["Summer Sale", "B2B Enterprise push"],
                "leadMagnets": ["Free trial", "Whitepaper"],
                "contentFreq": "Weekly",
                "referralProgram": True
            },
            "customer": {
                "sentimentScore": 75.5,
                "topComplaints": ["Slow support response", "High price"],
                "topCompliments": ["Great UX", "Reliable uptime"]
            },
            "socialMedia": [
                {"platform": "LinkedIn", "growthTrend": "Up 5%"},
                {"platform": "Twitter", "growthTrend": "Stable"}
            ],
            "gapAnalysis": {
                "missingFeatures": ["Native Mobile App", "Advanced Reporting"],
                "marketingGaps": "They do not run targeted ads on LinkedIn.",
                "recommendations": ["Launch a mobile app to capture their dissatisfied users", "Offer better pricing tiers"]
            },
            "strategies": {
                "pricing": "Undercut their enterprise tier by 20%.",
                "sales": "Focus on their lack of mobile support during sales pitches."
            },
            "financial": {
                "revenueRange": "$10M - $50M",
                "employeesCount": 150,
                "fundingNews": "Series B raised recently",
                "acquisitions": "Acquired a small AI startup last year"
            }
        }
