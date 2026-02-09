from app import app
from models import db, Idea, Company, User
from ideas import run_volcano_analysis
import threading

def debug_new_signal():
    with app.app_context():
        # 1. Create a dummy signal
        sender = User.query.first()
        company = Company.query.first()
        if not sender or not company:
            print("No user or company found to test with.")
            return

        print(f"DEBUG: Creating test signal from {sender.username} to {company.company_name}")
        
        new_idea = Idea(
            title="Debug Signal Test",
            content="Testing if the volcano thread starts correctly.",
            sender_id=sender.id,
            recipient_company_id=company.id,
            signal_type="debug",
            status='processing',
            is_useful=False, 
            potential_value="Debugging...",
            tags="Debug"
        )
        db.session.add(new_idea)
        db.session.commit()
        print(f"DEBUG: Signal #{new_idea.id} created in DB.")

        # 2. Run Analysis SYNCHRONOUSLY to catch errors
        print("DEBUG: Starting analysis synchronously...")
        try:
            # We need to simulate how ideas.py calls it.
            # It passes app_instance. 
            # In this script, 'app' is the app.
            run_volcano_analysis(app, new_idea.id, company.company_name, new_idea.title, new_idea.content)
            print("DEBUG: Analysis completed successfully.")
        except Exception as e:
            print(f"DEBUG: Analysis FAILED with error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    debug_new_signal()
