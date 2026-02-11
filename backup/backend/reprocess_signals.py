from app import app
from models import db, Idea, Company
from agents import run_pipeline

def reprocess_stuck_signals():
    with app.app_context():
        # Find signals stuck in 'processing'
        # Also maybe check for ones with empty logs if they failed silently? 
        # For now, just 'processing' is the safe bet.
        stuck_ideas = Idea.query.filter_by(status='processing').all()
        
        print(f"Found {len(stuck_ideas)} stuck signals.")
        
        for idea in stuck_ideas:
            print(f"--- Reprocessing Signal #{idea.id}: {idea.title} ---")
            
            # Re-fetch company
            company = Company.query.get(idea.recipient_company_id)
            if not company:
                print(f"Skipping #{idea.id}: Target company not found.")
                continue
                
            # Fetch Context (same logic as ideas.py)
            recent_ideas = Idea.query.filter_by(recipient_company_id=company.id)\
                .filter(Idea.id != idea.id)\
                .order_by(Idea.created_at.desc()).limit(20).all()
            
            recent_context = [f"Title: {i.title}, Content: {i.content}, Status: {i.status}" for i in recent_ideas]
            
            # Run Pipeline Synchronously
            try:
                analysis = run_pipeline(idea.title, idea.content, company.company_name, recent_context, idea.signal_type, idea_id=idea.id)
                
                # Update DB
                if analysis['valid']:
                    print(f"Approved: Signal #{idea.id}")
                    idea.status = 'sent_to_boardroom'
                    idea.tags = analysis.get('tags', '')
                    idea.ai_analysis_log = analysis['log']
                else:
                    print(f"Rejected: Signal #{idea.id}")
                    idea.status = 'volcano_rejected'
                    idea.ai_analysis_log = analysis['log'] + f"\n\n[FINAL REJECTION REASON]: {analysis['reason']}"
                
                db.session.commit()
                print(f"Saved result for Signal #{idea.id}")
                
            except Exception as e:
                print(f"Failed to reprocess #{idea.id}: {e}")

if __name__ == "__main__":
    reprocess_stuck_signals()
