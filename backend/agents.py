# AI Agent Swarm definition: Core logic for Gatekeeper, Detective, Historian, Visionary.
import os
import json
import time
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- SHARED STATE FOR UI VISUALIZATION ---
# Even though we have 1 agent, we will map its steps to the UI for visualization.
from shared_state import ACTIVE_LOGS

# --- AGENT LOGGING ---
class AgentLog:
    def __init__(self, idea_id=None):
        self.logs = []
        self.start_time = time.time()
        self.idea_id = idea_id
        if self.idea_id:
            # UI Expects a list of agents. We create "Virtual Steps" to show progress.
            ACTIVE_LOGS[self.idea_id] = {
                "agents": ["Read & Validate", "Noise Filter", "Search & Verify", "Final Verdict"],
                "current_agent": "Read & Validate",
                "logs": []
            }

    def update_step(self, step_name):
        if self.idea_id and self.idea_id in ACTIVE_LOGS:
            ACTIVE_LOGS[self.idea_id]["current_agent"] = step_name

    def add(self, status, message):
        timestamp = time.time() - self.start_time
        entry = f"[{timestamp:.1f}s] {status}: {message}"
        self.logs.append(entry)
        print(entry)
        
        # Live Update
        if self.idea_id and self.idea_id in ACTIVE_LOGS:
            ACTIVE_LOGS[self.idea_id]["logs"].append(entry)

    def get_full_log(self):
        if self.idea_id and self.idea_id in ACTIVE_LOGS:
            del ACTIVE_LOGS[self.idea_id]
        return "\n".join(self.logs)


# --- SUPER AGENT (The Thinking Engine) ---
def run_super_agent(title, content, log):
    log.add("Thinking Engine", "Initializing Single Super-Agent...")
    
    # User's EXACT Instruction Set from GCP Agent Builder
    system_instruction = """
    You are the Thinking Engine Agent.
    Follow these instructions STRICTLY in order:

    1. Read the message/signal
    2. Validate is that can be an idea that can be sent to company or is this a normal message or any spam.
    3. if not a valid idea, break the flow and reject the idea and return "not an valid idea".
    4. once we found that idea is not a spam, move to next step.
    5. Use Google Search or refer internet to check if the feature already exists with that company or any such plan is already in trails of that company to implement.
    6. Break the flow and return as "not an valid idea".
    7. if it is an idea which is unique and not under plan of that company. then check how good is that idea will for that company to implement.
    8. If idea is good enough and idea is not spam and it is having good novelty and can help that company to grow, then return "Good Idea" if not, return "not an valid idea".
    
    CRITICAL OUTPUT RULE:
    You must output a SINGLE JSON object. Do not include any conversational text outside the JSON.
    Format:
    { 
        "valid": boolean, 
        "reason": "concise reason for decision", 
        "tags": "tag1, tag2" 
    }
    """

    user_prompt = f"""
    Signal Title: {title}
    Signal Content: {content}
    """

    log.add("STEP 1-2", "Reading & Validating Signal...")
    
    try:
        # Step 1-4: Initial Read & Filter
        log.update_step("Read & Validate")
        
        # Single Call with Tools (Google Search)
        # We rely on the model to follow the step-by-step reasoning internally
        # or invoke the tool if it reaches step 5.
        
        log.add("STEP 5", "Checking External Knowledge (Google Search)...")
        log.update_step("Search & Verify")

        response = client.models.generate_content(
            model='gemini-2.0-flash', 
            contents=user_prompt,
            config=GenerateContentConfig(
                tools=[Tool(google_search=GoogleSearch())], 
                # response_mime_type='application/json', # REMOVED: Incompatible with Search Tool
                system_instruction=system_instruction
            )
        )
        
        # Parse Response (Handle Markdown Code Blocks & Free Text)
        raw_text = response.text
        # Try to find JSON block using Regex
        import re
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        
        if json_match:
            args_text = json_match.group(0)
            try:
                api_response = json.loads(args_text)
            except json.JSONDecodeError:
                 log.add("WARNING", "JSON Parse Failed (inner). Raw: " + args_text[:50])
                 # Check if it returned a tool call instead? No, client handles tool calls invisible here unless we stream?
                 # Actually, with Tools enabled, the model might return a FunctionCall object, but SDK 'generate_content' returns text if tool config is auto.
                 # Wait, Google Search tool returns grounded response text usually.
                 api_response = {"valid": False, "reason": "AI Output Malformed", "tags": "Error"}
        else:
            log.add("WARNING", "No JSON found in response. Raw: " + raw_text[:50])
            api_response = {"valid": False, "reason": "AI Output Malformed (No JSON)", "tags": "Error"}
        
        log.update_step("Final Verdict")
        
        if api_response.get('valid', False):
             reason = api_response.get('reason', 'Novelty Verified')
             log.add("STEP 7-8", f"Strategic Value Confirmed: {reason}")
             log.add("RESULT", "Good Idea - Sending to Boardroom")
             return True, "Good Idea", api_response.get('tags', 'Good Idea')
        else:
             reason = api_response.get('reason', 'Not a valid idea')
             log.add("RESULT", f"Rejected: {reason}")
             return False, reason, None

    except Exception as e:
        log.add("ERROR", f"Super Agent Failed: {e}")
        return False, f"System Error: {e}", None


# --- MAIN PIPELINE ORCHESTRATOR ---
def run_pipeline(title, content, company_name, recent_ideas, signal_type="New Feature", idea_id=None):
    log = AgentLog(idea_id)
    
    # We now use ONLY the Super Agent for EVERYTHING
    # The user requested "1 agent where it should get the message... every message".
    
    valid, reason, tags = run_super_agent(title, content, log)
    
    return {
        "valid": valid, 
        "reason": reason, 
        "tags": tags, 
        "log": log.get_full_log()
    }
