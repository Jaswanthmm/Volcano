# Legacy AI analysis logic (partially superseded by worker.py/agents.py but still referenced).
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
        # Construct Context String (Most Recent First)
        context_str = "Recent signals received by this boardroom (MOST RECENT FIRST):\n"
        if recent_ideas_context:
            for idea in recent_ideas_context:
                context_str += f"- {idea}\n"
        else:
            context_str += "No recent signals.\n"
        
        # DEBUG: Verify what the AI sees
        print("--- DEBUG: AI CONTEXT ---")
        print(context_str)
        print("-------------------------")

        prompt = f"""
        You are an advanced AI Gatekeeper ("The Brain") for a high-tech corporate boardroom. 
        Your goal is to screen incoming ideas ("Signals") with intense scrutiny.
        
        TARGET BOARDROOM: {company_name}
        
        INCOMING SIGNAL:
        Title: {title}
        Content: {content}
        
        CONTEXT (Last 20 Signals):
        {context_str}
        
        ---
        
        ### FEW-SHOT TRAINING EXAMPLES (LEARN FROM THESE):
        
        [Example 1]
        Context: "- Title: Cancelled Packs, Content: Sell cancelled orders via popups."
        Incoming: "Title: rejecting the order, Content: if food orders cancelled... sell to nearby users at discount."
        Analysis: Both describe selling cancelled food to nearby users.
        Result: DUPLICATE.

        [Example 2]
        Context: "- Title: Waste Food, Content: Sell cancelled orders."
        Incoming: "Title: Food Management, Content: Trigger: Order cancelled -> Offer to nearby."
        Analysis: Mechanism is identical (Cancel -> Sell).
        Result: DUPLICATE.

        ---
        
        ### ANALYSIS PROTOCOL (CHAIN OF THOUGHT):
        Before deciding, you must "think" through these steps:
        
        1. **PROFILE**: Identify {company_name} using your World Knowledge. What is their core business? (e.g. Swiggy -> Food/Grocery, Uber -> Transport).
        2. **ABSTRACT**: Extract the "Operational Logic" of the incoming signal (Trigger -> Action -> Result).
        3. **COMPARE (EXTREME STRICTNESS)**: check the `CONTEXT`.
           - Compare the "Operational Logic" of this signal against previous signals.
           - If the *Logic* is the same (e.g. "Cancel Order -> Sell to nearby user"), it is a **DUPLICATE**, even if the words are completely different.
           - *Rule*: Same Solution + Same Problem = DUPLICATE.
        4. **HISTORY**: Check `CONTEXT` for similar ideas with `Status: rejected` or `Status: volcano_rejected`.
           - If YES -> Rejection: HISTORICAL REJECTION.
        5. **STRATEGY & EXISTING TECH**: 
           - Does this align with the **PROFILE** you identified in Step 1?
           - Does {company_name} *already* do this? Use your internal knowledge of their app/services.
           - If YES -> Rejection: EXISTING FEATURE / STRATEGIC MISMATCH.
        6. **FEASIBILITY**: Is the idea logically coherent?
        
        ---
        
        ### OUTPUT FORMAT:
        Return a pure JSON object. You MUST include your "reasoning_trace" to prove you thought about it.
        {{
            "reasoning_trace": "Step 1: The idea is... Step 2: Overlap found with...",
            "valid": boolean,
            "reason": "string (The final rejection message for the user, e.g. 'Invalid Signal (Duplicate Payload)')",
            "value": "string (Estimated Value, e.g. '$100,000' OR 'N/A')",
            "tags": "string (comma-separated tags)"
        }}
        """
        
        generation_config = genai.types.GenerationConfig(temperature=0.0)
        model = genai.GenerativeModel('gemini-2.0-flash', generation_config=generation_config)
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
