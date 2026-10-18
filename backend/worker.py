# Dedicated background worker process for running the AI "Thinking Engine" pipeline (WORK-01).
# Supports standalone execution, Cloud Run worker services, Cloud Tasks webhooks, and local async processing.

import sys
import os
import time
from threading import Thread
from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

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
                idea.ai_analysis_log = analysis['log'] + f"\n\n[FINAL REJECTION REASON]: {analysis['reason']}"
                
                # Feedback Message for alien operative
                msg = Message(
                    idea_id=idea.id,
                    sender_type='volcano', 
                    content=f"COGNITIVE CORE ALERT: {analysis['reason']}"
                )
                db.session.add(msg)
            
            db.session.commit()
            print(f"[Worker] Successfully completed Signal #{idea.id}")
            return True

        except Exception as e:
            print(f"[Worker] CRITICAL FAILURE on Signal #{idea_id}: {e}")
            try:
                from models import db, Idea, Message
                idea = db.session.get(Idea, idea_id)
                if idea:
                    error_str = str(e)
                    if "429" in error_str or "resource_exhausted" in error_str.lower():
                        friendly_error = "Cognitive Core capacity reached (429). Retrying advised."
                    else:
                        friendly_error = f"System Error: {error_str}"

                    idea.status = 'volcano_rejected'
                    idea.ai_analysis_log = f"SYSTEM ERROR: {friendly_error}"

                    msg = Message(
                        idea_id=idea.id,
                        sender_type='volcano',
                        content=f"COGNITIVE CORE ALERT: {friendly_error}"
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
