# Dedicated background worker process for running the AI "Thinking Engine" pipeline (WORK-01).
# Supports standalone execution, Cloud Run worker services, Cloud Tasks webhooks, and local async processing.

import sys
import os
import time
from threading import Thread
from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(override=True)

def sanitize_user_feedback(raw_reason: str) -> str:
    """
    Sanitizes pipeline rejection reasons to ensure technical errors, stack traces,
    HTTP status codes, or third-party API JSON payloads are NEVER leaked to end users.
    Normal domain evaluation reasons (e.g. duplicates, feasibility, novelty) pass through safely.
    """
    if not raw_reason:
        return "Neural pipeline encountered a temporary processing anomaly. Please retry your submission."

    lower = raw_reason.lower()

    # Check for technical / system / API / network errors
    is_system_error = (
        raw_reason.startswith("System Error:") or
        "traceback" in lower or
        "exception" in lower or
        "{'error'" in raw_reason or
        '{"error"' in raw_reason or
        "ai output malformed" in lower or
        "ai system offline" in lower or
        "configuration error" in lower or
        "gemini api key missing" in lower or
        "404 not_found" in lower
    )

    if not is_system_error:
        # Safe domain reason from the LLM evaluator (e.g. "Duplicate idea already submitted", etc.)
        return raw_reason

    # Technical error detected: map to professional, reassuring user guidance
    if any(term in lower for term in ["429", "resource_exhausted", "quota", "rate limit", "too many requests"]):
        return "High cognitive demand temporarily throttled this analysis. Please resubmit your signal in a few moments."
    elif any(term in lower for term in ["404", "not_found", "deprecated", "no longer available", "model"]):
        return "Cognitive reasoning cluster is currently refreshing its model weights. Please try submitting again shortly."
    elif any(term in lower for term in ["timeout", "503", "unavailable", "deadline exceeded"]):
        return "External knowledge verification timed out. Please try again shortly."
    elif any(term in lower for term in ["api key", "configuration", "offline"]):
        return "Cognitive reasoning services are temporarily undergoing maintenance. Please try again shortly."
    else:
        return "Neural pipeline encountered a temporary processing anomaly. Please retry your submission."


def process_signal(app, idea_id):
    """
    Processes a single signal (Idea) through the Volcano Thinking Engine pipeline.
    Transitions status: 'queued' -> 'processing' -> 'sent_to_boardroom' | 'volcano_rejected'.
    """
    with app.app_context():
        from models import db, Idea, Company, Message
        from agents import run_pipeline

        try:
            # 1. Fetch Request
            idea = db.session.get(Idea, idea_id)
            if not idea:
                print(f"[Worker] Error: Signal #{idea_id} not found in database.")
                return False

            print(f"[Worker] Processing Signal #{idea.id}: {idea.title}")
            
            # 2. Update Status to Processing
            idea.status = 'processing'
            db.session.commit()
            
            # 3. Fetch Context
            company = db.session.get(Company, idea.recipient_company_id)
            if not company:
                print(f"[Worker] Error: Target Company {idea.recipient_company_id} not found.")
                idea.status = 'volcano_rejected'
                idea.ai_analysis_log = "Error: Target Company not found."
                db.session.commit()
                return False

            recent_ideas = Idea.query.filter_by(recipient_company_id=company.id)\
                .filter(Idea.id != idea.id)\
                .order_by(Idea.created_at.desc()).limit(20).all()
            
            recent_context = [f"Title: {i.title}, Content: {i.content}, Status: {i.status}" for i in recent_ideas]

            # 4. Run AI Pipeline
            print(f"[Worker] Invoking AI Swarm for {company.company_name}...")
            analysis = run_pipeline(
                idea.title, 
                idea.content, 
                company.company_name, 
                recent_context, 
                idea.signal_type, 
                idea_id=idea.id
            )
            
            # Refetch to ensure attached to session
            idea = db.session.get(Idea, idea_id)

            # 5. Save Results
            if analysis['valid']:
                print(f"[Worker] APPROVED Signal #{idea.id} -> sent_to_boardroom")
                idea.status = 'sent_to_boardroom'
                idea.tags = analysis.get('tags', '')
                idea.ai_analysis_log = analysis['log']
            else:
                print(f"[Worker] REJECTED Signal #{idea.id} -> volcano_rejected")
                idea.status = 'volcano_rejected'
                # Full technical log and reason preserved for internal admin inspection
                idea.ai_analysis_log = analysis['log'] + f"\n\n[FINAL REJECTION REASON]: {analysis['reason']}"
                
                # Feedback Message for alien operative (sanitized for user security & experience)
                user_feedback = sanitize_user_feedback(analysis.get('reason', ''))
                msg = Message(
                    idea_id=idea.id,
                    sender_type='volcano', 
                    content=f"COGNITIVE CORE STATUS: {user_feedback}"
                )
                db.session.add(msg)
            
            db.session.commit()
            print(f"[Worker] Successfully completed Signal #{idea.id}")
            return True

        except Exception as e:
            import traceback
            print(f"[Worker] CRITICAL FAILURE on Signal #{idea_id}: {e}")
            traceback.print_exc()
            try:
                from models import db, Idea, Message
                idea = db.session.get(Idea, idea_id)
                if idea:
                    error_str = str(e)
                    # Technical detail preserved for internal audit & Thinking Engine admin logs
                    idea.ai_analysis_log = f"SYSTEM EXCEPTION: {error_str}\n\nTRACEBACK:\n{traceback.format_exc()}"
                    idea.status = 'volcano_rejected'

                    # Clean, sanitized user-facing feedback without raw stack traces or internal API dicts
                    user_friendly_note = sanitize_user_feedback(error_str)

                    msg = Message(
                        idea_id=idea.id,
                        sender_type='volcano',
                        content=f"COGNITIVE CORE STATUS: {user_friendly_note}"
                    )
                    db.session.add(msg)
                    db.session.commit()
            except Exception as inner_e:
                print(f"[Worker] Failsafe rollback failed: {inner_e}")
                try:
                    db.session.rollback()
                except Exception:
                    pass
            return False

def trigger_async_process(app, idea_id):
    """
    Asynchronously triggers processing of an idea without blocking the HTTP request handler (WORK-01).
    """
    thread = Thread(target=process_signal, args=(app, idea_id), daemon=True)
    thread.start()
    return thread

def fetch_next_queued_idea(db, Idea):
    """
    Fetches the next queued idea, utilizing SKIP LOCKED on PostgreSQL to prevent concurrency races.
    """
    query = Idea.query.filter_by(status='queued').order_by(Idea.created_at.asc())
    
    # Use with_for_update(skip_locked=True) if supported by the dialect (PostgreSQL)
    try:
        if db.engine.dialect.name == 'postgresql':
            query = query.with_for_update(skip_locked=True)
    except Exception:
        pass

    return query.first()

def run_worker(poll_interval=2, single_run=False):
    """
    Continuous or single-run worker loop polling for queued signals (WORK-01).
    """
    from app import app
    from models import db, Idea

    print("--- VOLCANO THINKING ENGINE (WORKER) STARTED ---")
    with app.app_context():
        try:
            db_target = app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]
            print(f"[Worker] Connected to DB: {db_target}")
        except Exception:
            print("[Worker] Connected to DB.")

    while True:
        try:
            with app.app_context():
                idea = fetch_next_queued_idea(db, Idea)
                
                if idea:
                    idea_id = idea.id
                    # Release lock by ending session query, then process
                    process_signal(app, idea_id)
                else:
                    if single_run:
                        break
                    time.sleep(poll_interval)

            if single_run:
                break

        except KeyboardInterrupt:
            print("\n[Worker] Graceful shutdown requested.")
            break
        except Exception as e:
            print(f"[Worker] Loop Error: {e}")
            if single_run:
                break
            time.sleep(poll_interval)

if __name__ == "__main__":
    run_worker()
