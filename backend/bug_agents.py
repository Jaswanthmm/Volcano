import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client (New SDK)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- AGENT: QA ENGINEER (BUG VERIFIER) ---
def run_bug_qa(title, content, log):
    log.add("QA ENGINEER", "VALIDATING", "Checking bug report integrity and known issues...")
    
    # AI with Google Search Logic
    prompt = f"""
    You are a Senior QA Engineer.
    Validate this BUG REPORT.
    
    Bug: {title}
    Details: {content}
    
    Task 1: Is the report clear? (Steps to reproduce, expected vs actual).
    Task 2: Search Google for 'App Name bug {title}' to see if it's a known issue.
    
    Output JSON: {{ "valid": boolean, "reason": "string" }}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash', 
            contents=prompt,
            config={
                'tools': [{'google_search': {}}], 
                'response_mime_type': 'application/json'
            }
        )
        api_response = json.loads(response.text)
        
        if not api_response['valid']:
             log.add("QA ENGINEER", "REJECTED", f"Invalid report: {api_response['reason']}")
             return False, api_response['reason']
             
        log.add("QA ENGINEER", "VERIFIED", "Bug report is valid and actionable.")
        return True, "Verified"

    except Exception as e:
        log.add("QA ENGINEER", "WARNING", f"Search failed: {e}. Assuming valid.")
        return True, "Verified (Offline)"

# --- AGENT: ENGINEERING MANAGER (TRIAGE) ---
def run_bug_triage(title, content, log):
    log.add("ENG MANAGER", "TRIAGING", "Assigning Priority (P0-P3) and Severity...")
    
    prompt = f"""
    You are an Engineering Manager.
    Triage this verified bug.
    
    Bug: {title} - {content}
    
    Output JSON: {{ "valid": true, "reason": "Triaged", "tags": "P(0-3), Severity" }}
    """
    
    # Fallback to flash if pro unavailable
    response = client.models.generate_content(
        model='gemini-2.0-flash', 
        contents=prompt,
        config={'response_mime_type': 'application/json'}
    )
    api_response = json.loads(response.text)
    
    tags = api_response.get('tags', 'P2, Normal')
    log.add("ENG MANAGER", "ASSIGNED", f"Bug triaged as {tags}.")
    return True, None, tags
