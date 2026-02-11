
# Dedicated background worker process for running the AI "Thinking Engine" pipeline.

import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import time
from dotenv import load_dotenv
from app import app
from models import db, Idea, Company, Message
from agents import run_pipeline

# Load environment variables
load_dotenv()

def process_signal(app, idea_id):
    """
    Processes a single signal (Idea) through the Volcano Thinking Engine.
    """
    with app.app_context():
        try:
            # 1. Fetch Request
            idea = Idea.query.get(idea_id)
            if not idea:
                print(f"[Worker] Error: Signal {idea_id} not found.")
                return

            print(f"[Worker] Processing Signal #{idea.id}: {idea.title}")
            
            # 2. Update Status to Processing
            idea.status = 'processing'
            db.session.commit()
            
            # 3. Fetch Context
            company = Company.query.get(idea.recipient_company_id)
            if not company:
                print(f"[Worker] Error: Target Company {idea.recipient_company_id} not found.")
                idea.status = 'volcano_rejected'
                idea.ai_analysis_log = "Error: Target Company not found."
                db.session.commit()
                return

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
            
            # Refetch to ensure session attached (though we are in same context)
            idea = Idea.query.get(idea_id)

            # 5. Save Results
            if analysis['valid']:
                print(f"[Worker] APPROVED Signal #{idea.id}")
                idea.status = 'sent_to_boardroom'
                idea.tags = analysis.get('tags', '')
                idea.ai_analysis_log = analysis['log']
            else:
                print(f"[Worker] REJECTED Signal #{idea.id}")
                idea.status = 'volcano_rejected'
                idea.ai_analysis_log = analysis['log'] + f"\n\n[FINAL REJECTION REASON]: {analysis['reason']}"
                
                # Feedback Message
                msg = Message(
                    idea_id=idea.id,
                    sender_type='volcano', 
                    content=f"COGNITIVE CORE ALERT: {analysis['reason']}"
                )
                db.session.add(msg)
            
            db.session.commit()
            print(f"[Worker] Finished Signal #{idea.id}")

        except Exception as e:
            print(f"[Worker] CRITICAL FAILURE on Signal {idea_id}: {e}")
            # Failsafe
            try:
                idea.status = 'volcano_rejected'
                idea.ai_analysis_log = f"SYSTEM ERROR: {str(e)}"
                db.session.commit()
            except:
                db.session.rollback()

def run_worker():
    print("--- VOLCANO THINKING ENGINE (WORKER) STARTED ---")
    # app is imported from app module
    
    with app.app_context():
        # Ensure DB is connected
        print(f"Connected to DB: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]}")

    while True:
        try:
            with app.app_context():
                # Poll for queued ideas
                # We look for 'queued' or 'processing' (in case worker crashed mid-process)
                # Actually, strictly 'queued' is safer. 'processing' might be stuck.
                # Let's handle 'queued' primarily.
                
                idea = Idea.query.filter_by(status='queued').order_by(Idea.created_at.asc()).first()
                
                if idea:
                    process_signal(app, idea.id)
                else:
                    # No work, sleep
                    time.sleep(2)
                    
        except Exception as e:
            print(f"[Worker] Loop Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_worker()
