
import requests
import json
import traceback

def test_register():
    url = "http://localhost:8001/api/auth/alien/register"
    payload = {
        "email": "debug_alien_test@gmail.com",
        "password": "sosecretpassword",
        "name": "Debug Alien"
    }
    
    try:
        print(f"Sending POST to {url}...")
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        
        print(f"Status Code: {response.status_code}")
        print("Response Text:")
        print(response.text)
        
        if response.status_code == 500:
            print("\n[CRITICAL] 500 Error Detected.")
            print("Ideally we check server logs, but since we can't see them, let's try to verify DB connection locally.")
            verify_db_local()

    except Exception:
        traceback.print_exc()

def verify_db_local():
    print("\n--- Verifying Local DB Connection & Schema ---")
    try:
        from dotenv import load_dotenv
        import os
        
        # Load env explicitly
        basedir = os.path.abspath(os.path.dirname(__file__))
        load_dotenv(os.path.join(basedir, '.env'))

        from app import app
        from models import db, User
        from sqlalchemy import text
        
        with app.app_context():
            print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
            try:
                # Test Connection
                db.session.execute(text('SELECT 1'))
                print("DB Connection: SUCCESS")
                
                # Test Table Existence
                print("Checking User table...")
                user_count = User.query.count()
                print(f"User Count: {user_count}")
                
                # Attempt manual insertion directly via SQLAlchemy to see if it fails
                print("Attempting manual DB insertion (Rolled back immediately)...")
                u = User(username='TEST-9999', email='test_manual@void.net', name='Test User', password_hash='hash')
                db.session.add(u)
                db.session.flush()
                print("Manual Flush: SUCCESS")
                db.session.rollback()
                print("Rollback: SUCCESS")
                
            except Exception as e:
                print(f"DB Verification FAILED: {e}")
                traceback.print_exc()
                
    except Exception as e:
        print(f"Setup Failed: {e}")

if __name__ == "__main__":
    test_register()
