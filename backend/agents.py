# AI Agent Swarm definition: Core logic for Gatekeeper, Detective, Historian, Visionary.
import os
import json
import time
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from langsmith import wrappers
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini Client Lazy Loaded
# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- SHARED STATE FOR UI VISUALIZATION ---
# Even though we have 1 agent, we will map its steps to the UI for visualization.
from shared_state import ACTIVE_LOGS

# --- AGENT LOGGING ---
class AgentLog:
    def __init__(self, idea_id=None):
        """Initializes the agent log, tracking start time and associating with an Idea ID."""
        self.logs = []
        self.start_time = time.time()
        self.idea_id = idea_id
        # If an idea ID is provided, initialize the shared UI state with simulated agent steps
        if self.idea_id:
            # UI Expects a list of agents. We create "Virtual Steps" to show progress.
            ACTIVE_LOGS[self.idea_id] = {
                "agents": ["Read & Validate", "Compare Database", "Search & Verify", "Final Verdict"],
                "current_agent": "Read & Validate",
                "logs": []
            }

    def update_step(self, step_name):
        """Updates the current processing step for the active idea in the UI state."""
        # Only update the step if the idea ID exists and is actively tracked in memory
        if self.idea_id and self.idea_id in ACTIVE_LOGS:
            ACTIVE_LOGS[self.idea_id]["current_agent"] = step_name

    def add(self, status, message):
        """Records a timestamped log entry and pushes it to the live UI view."""
        timestamp = time.time() - self.start_time
        entry = f"[{timestamp:.1f}s] {status}: {message}"
        self.logs.append(entry)
        print(entry)
        
        # Live Update
        # If tracking is active, append the new log entry onto the UI state's logs array
        if self.idea_id and self.idea_id in ACTIVE_LOGS:
            ACTIVE_LOGS[self.idea_id]["logs"].append(entry)

    def get_full_log(self):
        """Returns the complete sequence of logs as a string and cleans up the active tracking state."""
        # If the log is actively tracked, remove it from memory to indicate completion
        if self.idea_id and self.idea_id in ACTIVE_LOGS:
            del ACTIVE_LOGS[self.idea_id]
        return "\n".join(self.logs)


# --- SUPER AGENT (The Thinking Engine) ---
def run_super_agent(title, content, company_name, recent_ideas, log):
    """
    The main reasoning pipeline: validates the idea format, checks for duplicates via RAG context, 
    and verifies novelty using Google Search.
    """
    log.add("Thinking Engine", "Initializing Single Super-Agent (with RAG)...")
    
    try:
        # LAZY LOAD CLIENT
        api_key = os.getenv("GEMINI_API_KEY")
        # If the API key is missing from environment variables, fail fast to avoid crashes
        if not api_key:
             log.add("ERROR", "Gemini API Key missing")
             return False, "Configuration Error", None
             
        client = genai.Client(api_key=api_key)
        
        # Wrap the Gemini client to enable LangSmith tracing
        client = wrappers.wrap_gemini(
            client,
            tracing_extra={
                "tags": ["gemini", "python"],
                "metadata": {
                    "integration": "google-genai",
                },
            },
        )
    except Exception as e:
        log.add("ERROR", f"Failed to initialize AI Client: {e}")
        return False, "AI System Offline", None

    # Format the recent_ideas RAG Context
    rag_context_str = "No recent ideas in database."
    # If the user has prior submitted ideas, format them into a bulleted list for context window
    if recent_ideas:
        rag_context_str = "\n".join([f"- {idea}" for idea in recent_ideas])

    # User's EXACT Instruction Set from GCP Agent Builder
    system_instruction = """
    You are the Thinking Engine Agent.
    Follow these instructions STRICTLY in order:

    1. Read the message/signal
    2. Validate is that can be an idea that can be sent to company or is this a normal message or any spam.
    3. if not a valid idea, break the flow and reject the idea and return "not an valid idea".
    4. once we found that idea is not a spam, move to next step.
    5. DATABASE RAG CHECK: Read the provided `DATABASE_CONTEXT`. If the new idea is identical or highly similar to any idea previously submitted based on context, break the flow and definitively reject it with reason "Duplicate idea already submitted".
    6. Use Google Search or refer internet to check if the feature already exists with that company or any such plan is already in trails of that company to implement.
    7. Break the flow and return as "not an valid idea" if it already exists.
    8. if it is an idea which is unique and not under plan of that company. then check how good is that idea will for that company to implement.
    9. If idea is good enough and idea is not spam and it is having good novelty and can help that company to grow, then return "Good Idea" if not, return "not an valid idea".
    
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
    Target Company: {company_name}
    
    Signal Title: {title}
    Signal Content: {content}
    
    --- DATABASE_CONTEXT (Previously sent ideas to prevent duplicates) ---
    {rag_context_str}
    ----------------------------------------------------------------------
    """

    log.add("STEP 1-2", "Reading & Validating Signal...")
    
    try:
        # Step 1-4: Initial Read & Filter
        log.update_step("Read & Validate")
        time.sleep(1)
        
        log.update_step("Compare Database")
        # If prior ideas are available, logically note down the database comparison length
        if recent_ideas:
            log.add("STEP 5", f"Comparing with {len(recent_ideas)} previous ideas in Database...")
        else:
            # If no past ideas are provided, clearly note that the step was skipped
            log.add("STEP 5", "No previous database entries found. Skipping comparison.")
        time.sleep(1)
        
        # Single Call with Tools (Google Search)
        # We rely on the model to follow the step-by-step reasoning internally
        # or invoke the Google tool.
        
        log.add("STEP 6", "Checking External Knowledge (Google Search)...")
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
        
        # If a JSON structure is captured from the text blocks, extract and parse it
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
            # If no JSON substring could be isolated, the model failed to follow generation instructions
            log.add("WARNING", "No JSON found in response. Raw: " + raw_text[:50])
            api_response = {"valid": False, "reason": "AI Output Malformed (No JSON)", "tags": "Error"}
        
        log.update_step("Final Verdict")
        
        # If the decoded structure signifies an accepted idea, return explicit success values
        if api_response.get('valid', False):
             reason = api_response.get('reason', 'Novelty Verified')
             log.add("STEP 7-8", f"Strategic Value Confirmed: {reason}")
             log.add("RESULT", "Good Idea - Sending to Boardroom")
             return True, "Good Idea", api_response.get('tags', 'Good Idea')
        else:
             # In instances the idea evaluation generated a reject state, return false gracefully
             reason = api_response.get('reason', 'Not a valid idea')
             log.add("RESULT", f"Rejected: {reason}")
             return False, reason, None

    except Exception as e:
        log.add("ERROR", f"Super Agent Failed: {e}")
        return False, f"System Error: {e}", None


# --- MAIN PIPELINE ORCHESTRATOR ---
def run_pipeline(title, content, company_name, recent_ideas, signal_type="New Feature", idea_id=None):
    """
    Main entry point for evaluating an idea submission. Sets up tracking and invokes the AI evaluator.
    """
    log = AgentLog(idea_id)
    
    # We now use ONLY the Super Agent for EVERYTHING
    # The user requested "1 agent where it should get the message... every message".
    
    valid, reason, tags = run_super_agent(title, content, company_name, recent_ideas, log)
    
    return {
        "valid": valid, 
        "reason": reason, 
        "tags": tags, 
        "log": log.get_full_log()
    }
