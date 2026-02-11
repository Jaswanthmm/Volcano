# Utility to import JSON data into PostgreSQL (Part 2 of Safe Migration).
import json
import os
from flask import Flask
from models import db, User, Company, Idea, Message
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    pg_uri = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = pg_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def import_data():
    basedir = os.path.abspath(os.path.dirname(__file__))
    json_path = os.path.join(basedir, 'export_data.json')
    
    if not os.path.exists(json_path):
        print("Error: export_data.json not found")
        return
        
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    app = create_app()
    with app.app_context():
        print("Connected to Postgres. Creating Schema...")
        db.drop_all() # Ensure fresh schema with updated lengths
        db.create_all()
        
        # Access raw DBAPI connection (psycopg2)
        raw_conn = db.engine.raw_connection()
        try:
            cursor = raw_conn.cursor()
            
            # Users
            users = data.get('users', [])
            if users:
                print(f"Importing {len(users)} Users (Raw Psycopg2)...")
                user_values = []
                for u in users:
                    verified = bool(u['is_verified']) if u.get('is_verified') else False
                    user_values.append((
                        u['id'], u['username'], u['name'], u['email'], 
                        u['password_hash'], verified
                    ))
                
                cursor.executemany(
                    'INSERT INTO "user" (id, username, name, email, password_hash, is_verified) VALUES (%s, %s, %s, %s, %s, %s)',
                    user_values
                )
                raw_conn.commit()
                
            # Companies
            companies = data.get('companies', [])
            if companies:
                print(f"Importing {len(companies)} Companies (Raw Psycopg2)...")
                company_values = []
                for c in companies:
                    verified = bool(c['is_verified']) if c.get('is_verified') else False
                    company_values.append((
                        c['id'], c['company_name'], c['email'], c['password_hash'],
                        verified, c['logo_url'], c['website_url']
                    ))

                cursor.executemany(
                    'INSERT INTO company (id, company_name, email, password_hash, is_verified, logo_url, website_url) VALUES (%s, %s, %s, %s, %s, %s, %s)',
                    company_values
                )
                raw_conn.commit()

            # ideas
            ideas = data.get('ideas', [])
            if ideas:
                # Build valid ID sets for FK validation
                valid_user_ids = {u['id'] for u in data.get('users', [])}
                valid_company_ids = {c['id'] for c in data.get('companies', [])}
                
                print(f"Importing Ideas (Raw Psycopg2)... Total: {len(ideas)}")
                idea_values = []
                skipped_count = 0
                valid_idea_ids = set() # Track inserted ideas
                
                for i in ideas:
                    # Validate Foreign Keys
                    if i['sender_id'] not in valid_user_ids:
                        skipped_count += 1
                        continue
                    if i['recipient_company_id'] not in valid_company_ids:
                        skipped_count += 1
                        continue

                    useful = bool(i['is_useful']) if i.get('is_useful') else False
                    signal = i.get('signal_type') or 'others'
                    status = i.get('status') or 'pending'
                    idea_values.append((
                        i['id'], i['title'], i['content'], signal, status, useful,
                        i.get('potential_value'), i.get('tags'), i['created_at'],
                        i['sender_id'], i['recipient_company_id'], i.get('ai_analysis_log')
                    ))
                    valid_idea_ids.add(i['id'])
                
                if skipped_count > 0:
                    print(f"  [INFO] Skipped {skipped_count} orphaned ideas.")
                    
                cursor.executemany(
                    'INSERT INTO idea (id, title, content, signal_type, status, is_useful, potential_value, tags, created_at, sender_id, recipient_company_id, ai_analysis_log) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
                    idea_values
                )
                raw_conn.commit()

            # Messages
            messages = data.get('messages', [])
            if messages:
                print(f"Importing {len(messages)} Messages (Raw Psycopg2)...")
                msg_values = []
                skipped_msgs = 0
                
                # If no ideas inserted, valid_idea_ids might be empty, so handle carefully
                # But if we have messages, we usually have ideas.
                if 'valid_idea_ids' not in locals(): valid_idea_ids = set()

                for m in messages:
                    if m['idea_id'] not in valid_idea_ids:
                        skipped_msgs += 1
                        continue
                        
                    msg_values.append((
                        m['id'], m['idea_id'], m['sender_type'], m['content'], m['created_at']
                    ))
                
                if skipped_msgs > 0:
                     print(f"  [INFO] Skipped {skipped_msgs} orphaned messages.")
                     
                cursor.executemany(
                    'INSERT INTO message (id, idea_id, sender_type, content, created_at) VALUES (%s, %s, %s, %s, %s)',
                    msg_values
                )
                raw_conn.commit()
            
            cursor.close()
        finally:
            raw_conn.close()
                
        print("SUCCESS: Data imported to PostgreSQL!")
                
        print("SUCCESS: Data imported to PostgreSQL!")
                
        print("SUCCESS: Data imported to PostgreSQL!")

if __name__ == "__main__":
    import_data()
