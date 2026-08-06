import ollama
import json
import re

async def analyze_company_with_ai(company_name: str, industry: str, main_text: str, website: str):
    """
    Uses Ollama to analyze the scraped text and extract insights.
    If Ollama is not available, it will fall back to returning a mock response.
    """
    prompt = f"""
    You are an expert business analyst and market researcher. 
    Analyze the following information about a company named '{company_name}' in the '{industry}' industry.
    Website: {website}
    
    Here is the scraped text from their website:
    {main_text[:4000]} # Limit text to avoid context window issues
    
    Please provide a structured JSON output with the following keys:
    - overview: A short 2-3 sentence overview of the company.
    - businessModel: E.g., B2B, B2C, D2C, Manufacturing, Retail.
    - targetCustomers: Who they sell to.
    - estimatedSize: E.g., Small, Medium, Enterprise.
    - marketPosition: E.g., Premium, Budget, Leader, Niche.
    - swot: An object containing 'strengths', 'weaknesses', 'opportunities', and 'threats' (each a list of strings).
    - products: A list of objects with 'name', 'description', and 'features'.
    
    Return ONLY valid JSON. Do not include markdown formatting or explanations.
    """
    
    try:
        response = ollama.chat(model='llama3.1', messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ])
        
        # Try to parse the JSON output
        content = response['message']['content']
        # Remove any markdown code block wrappers if they exist
        content = re.sub(r'```json\n|\n```|```', '', content).strip()
        
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"Ollama AI analysis failed (is Ollama running?): {e}")
        # Mock response fallback
        return {
            "overview": f"{company_name} is a company in the {industry} sector based on our initial findings.",
            "businessModel": "B2B / B2C",
            "targetCustomers": "General consumers and businesses",
            "estimatedSize": "Medium",
            "marketPosition": "Growing",
            "swot": {
                "strengths": ["Strong product lineup", "Good market presence"],
                "weaknesses": ["Limited digital footprint"],
                "opportunities": ["Expansion into new territories", "SEO optimization"],
                "threats": ["New market entrants"]
            },
            "products": [
                {"name": "Core Product", "description": f"Main offering of {company_name}", "features": "Durable, Reliable"}
            ]
        }
