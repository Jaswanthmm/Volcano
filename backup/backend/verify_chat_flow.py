from app import app
from models import db, User, Company, Idea, Message
import time

def verify_flow():
    with app.app_context():
        # Setup
        alien = User.query.filter_by(username='ALIEN-P7JM').first()
        company = Company.query.get(5) # Swiggy
        
        print(f"Alien: {alien.username} (ID: {alien.id})")
        print(f"Company: {company.company_name} (ID: {company.id})")

        # 1. Simulate Rejected Idea
        print("\n--- Test 1: Rejected Idea Log ---")
        rejected_idea = Idea(
            title="Bad Idea",
            content="This is terrible",
            sender_id=alien.id,
            recipient_company_id=company.id,
            status='volcano_rejected',
            ai_analysis_log="[REJECTION LOG]: Logic flawed. Market cap insufficient."
        )
        db.session.add(rejected_idea)
        db.session.commit()
        
        # Test API response for log
        client = app.test_client()
        res = client.get(f'/api/ideas/my?identifier={alien.username}')
        data = res.json
        target = next((i for i in data if i['id'] == rejected_idea.id), None)
        if target and target.get('analysis_log') == "[REJECTION LOG]: Logic flawed. Market cap insufficient.":
            print("SUCCESS: Analysis Log returned correctly.")
        else:
            print("FAILURE: Analysis Log missing or incorrect.")
            print("Received:", target.get('analysis_log') if target else "Idea not found")

        # 2. Simulate Chat Flow
        print("\n--- Test 2: Chat Unlock Flow ---")
        chat_idea = Idea(
            title="Good Idea",
            content="This is great",
            sender_id=alien.id,
            recipient_company_id=company.id,
            status='interesting'
        )
        db.session.add(chat_idea)
        db.session.commit()
        
        # Verify Message Count 0 (Locked)
        res = client.get(f'/api/messages/{chat_idea.id}')
        msgs = res.json
        print(f"Initial Messages: {len(msgs)} (Should be 0 - Locked)")
        
        # Boardroom Sends Message
        msg = Message(idea_id=chat_idea.id, sender_type='titan', content="Hello Alien")
        db.session.add(msg)
        db.session.commit()
        
        # Verify Message Count 1 (Unlocked)
        res = client.get(f'/api/messages/{chat_idea.id}')
        msgs = res.json
        print(f"Messages after Boardroom: {len(msgs)} (Should be 1 - Unlocked)")
        
        # Clean up
        db.session.delete(rejected_idea)
        db.session.delete(chat_idea)
        db.session.delete(msg)
        db.session.commit()

if __name__ == "__main__":
    verify_flow()
