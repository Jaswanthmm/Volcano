import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_signal(title, content, company_name, recent_ideas_context):
    """
    Analyzes the signal using Google Gemini (Primary) or Heuristics (Fallback).
    """
    print(f"Analyzing Signal: {title}")
    combined_text = (title + " " + content).lower()

    # --- 1. Quick Heuristic Pre-Check (Always Active) ---
    # Catch obvious test data immediately to save API tokens
    test_keywords = ["garbage", "test message", "testing", "asdf", "hello world", "check 1 2"]
    if any(kw in combined_text for kw in test_keywords):
         return {"valid": False, "reason": "Automated Filter: Test/Junk data detected."}

    # --- 2. AI Analysis (Gemini 2.0 Flash) ---
    try:
        # Construct Context String
        context_str = "Recent signals received by this boardroom:\n"
        if recent_ideas_context:
            for idea in recent_ideas_context:
                context_str += f"- {idea}\n"
        else:
            context_str += "No recent signals.\n"

        prompt = f"""
        You are an advanced AI Gatekeeper for a high-tech corporate boardroom. Your job is to filter incoming "Signals" (ideas) from Aliens.
        
        TARGET BOARDROOM: {company_name}
        
        INCOMING SIGNAL:
        Title: {title}
        Content: {content}
        
        CONTEXT (Previous Signals):
        {context_str}
        
        TASK:
        Analyze the incoming signal and determine if it should be let through.
        
        CRITERIA FOR REJECTION (Filter it if ANY are true):
        1. NONSENSE/LOW QUALITY: Gibberish, "test", "hello", or very low effort/short content (e.g. "some garbage").
        2. DUPLICATE (STRICT): Compare against Context. REJECT if the underlying idea is the same, even if rephrased (e.g. "Drone delivery" vs "Flying package droppers"). Synonyms/Rewrites = DUPLICATE.
        3. EXISTING FEATURE: Something {company_name} definitely already has.
        4. SPAM: Malicious or irrelevant.
        
        OUTPUT FORMAT (JSON):
        {{
            "valid": boolean,
            "reason": "string (short explanation)",
            "value": "string (money)",
            "tags": "string (tags)"
        }}
        """
        
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(text)
        return analysis

    except Exception as e:
        print(f"AI Analysis Failed (Using Fallback): {e}")
        
        # --- 3. Robust Fallback Heuristics ---
        
        # Coherence: Check for repeated characters
        if len(content) > 10 and len(set(content.lower())) < 6:
             return {"valid": False, "reason": "Nonsense detected (Low entropy)."}
        
        # Length Check: Too short?
        if len(content.split()) < 3:
             return {"valid": False, "reason": "Signal too weak (insufficient detail)."}

        # Keyword Check (Expanded)
        gibberish_patterns = ["laksjdf", "asdfg", "qwer", "123456", "garbage", "random"]
        for pat in gibberish_patterns:
            if pat in combined_text:
                return {"valid": False, "reason": "Nonsense detected (Keyword pattern)."}
        
        # Redundancy Check (Deep Content Scan)
        if recent_ideas_context:
            for idea_str in recent_ideas_context:
                # idea_str often mimics "Title: [T], Content: [C]" structure from backend
                # Check if the core payload (content) appears in previous signals
                if content.lower() in idea_str.lower() or idea_str.lower() in content.lower():
                     return {"valid": False, "reason": "Invalid Signal (Duplicate Payload)."}
                
                # Check Title for good measure
                if title.lower() in idea_str.lower():
                     return {"valid": False, "reason": "Invalid Signal (Duplicate Title)."}

        # Knowledge Base (Demo specific)
        if company_name == "Swiggy" and "food delivery" in combined_text and "drone" not in combined_text:
             return {"valid": False, "reason": "Invalid Signal (Existing Feature)."}

        import random
        val = random.randint(10, 500) * 1000
        tags_pool = ["Logistics", "AI", "Consumer Tech", "Bio-Hacking", "Quantum"]
        tags = ", ".join(random.sample(tags_pool, k=2))

        return {
            "valid": True, 
            "reason": "Valid signal accepted by Logic Core (Fallback).", 
            "value": f"${val:,}", 
            "tags": tags
        }
