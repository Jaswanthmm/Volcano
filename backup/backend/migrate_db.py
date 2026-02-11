import os
# Primary migration script involved in moving data from SQLite to PostgreSQL (Historical).
import sqlite3
from flask import Flask
from models import db, User, Company, Idea, Message
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app(db_uri):
    """Factory to create a minimal Flask app with a specific DB URI"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def get_sqlite_data(db_path, table_name):
    """Reads all rows from a SQLite table and returns them as a list of dicts"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row # Access columns by name
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    
    # Convert mappings to dicts
    result = [dict(row) for row in rows]
    conn.close()
    return result

def migrate():
    print("--- VOLCANO DATA MIGRATION PROTOCOL (RAW SQL READ) ---")

    # 1. READ FROM SQLITE (using sqlite3 lib)
    basedir = os.path.abspath(os.path.dirname(__file__))
    sqlite_path = os.path.join(basedir, 'ideas.db')
    
    print(f"\n[PHASE 1] Extracting Data from Local SQLite: {sqlite_path}")
    
    try:
        if not os.path.exists(sqlite_path):
            print(f"Error: Database file not found at {sqlite_path}")
            return

        users_data = get_sqlite_data(sqlite_path, "user")
        companies_data = get_sqlite_data(sqlite_path, "company")
        ideas_data = get_sqlite_data(sqlite_path, "idea")
        messages_data = get_sqlite_data(sqlite_path, "message")
        
        print(f"  > Extracted {len(users_data)} Users")
        print(f"  > Extracted {len(companies_data)} Companies")
        print(f"  > Extracted {len(ideas_data)} Ideas")
        print(f"  > Extracted {len(messages_data)} Messages")
        
    except Exception as e:
        print(f"  [ERROR] Failed to read SQLite: {e}")
        return

    # 2. WRITE TO POSTGRES (using ORM)
    print("\n[PHASE 2] Connecting to PostgreSQL Target...")
    pg_uri = os.getenv('DATABASE_URL')
    
    if not pg_uri or 'postgres' not in pg_uri:
        print("  [CRITICAL ERROR] 'DATABASE_URL' not found or invalid in .env")
        print("  Please set DATABASE_URL=postgresql://user:pass@localhost/dbname in backend/.env")
        return

    app_pg = create_app(pg_uri)
    
    with app_pg.app_context():
        try:
            print(f"  > Connected to: {pg_uri.split('@')[-1]}") # Hide password types
            
            # Create Schema
            print("  > Initializing Schema...")
            db.create_all()
            
            # Create Schema
            print("  > Initializing Schema...")
            db.create_all()
            
            # Create Schema
            print("  > Initializing Schema...")
            db.create_all()
            
            # Create Schema
            print("  > Initializing Schema...")
            db.create_all()
            
            from sqlalchemy import text
            
            # Get Engine Connection
            with db.engine.connect() as conn:
                # Users
                print("  > preparing User data...")
                users_dicts = []
                for u in users_data:
                    u['name'] = u.get('name') # Ensure key exists
                    u['password_hash'] = u.get('password_hash')
                    u['is_verified'] = bool(u['is_verified']) if 'is_verified' in u else False
                    users_dicts.append(u)
                
                if users_dicts:
                    print(f"  > Raw INSERT {len(users_dicts)} Users...")
                    stmt = text("""
                        INSERT INTO "user" (id, username, name, email, password_hash, is_verified)
                        VALUES (:id, :username, :name, :email, :password_hash, :is_verified)
                    """)
                    conn.execute(stmt, users_dicts)
                    conn.commit()
                
                # Companies
                print("  > preparing Company data...")
                companies_dicts = []
                for c in companies_data:
                    c['password_hash'] = c.get('password_hash')
                    c['logo_url'] = c.get('logo_url')
                    c['website_url'] = c.get('website_url')
                    c['is_verified'] = bool(c['is_verified']) if 'is_verified' in c else False
                    companies_dicts.append(c)

                if companies_dicts:
                    print(f"  > Raw INSERT {len(companies_dicts)} Companies...")
                    stmt = text("""
                        INSERT INTO company (id, company_name, email, password_hash, is_verified, logo_url, website_url)
                        VALUES (:id, :company_name, :email, :password_hash, :is_verified, :logo_url, :website_url)
                    """)
                    conn.execute(stmt, companies_dicts)
                    conn.commit()
                
                # Ideas
                print("  > preparing Idea data...")
                ideas_dicts = []
                for i in ideas_data:
                    i['signal_type'] = i.get('signal_type', 'others') or 'others'
                    i['status'] = i.get('status', 'pending') or 'pending'
                    i['is_useful'] = bool(i['is_useful']) if 'is_useful' in i else False
                    i['potential_value'] = i.get('potential_value')
                    i['tags'] = i.get('tags')
                    i['ai_analysis_log'] = i.get('ai_analysis_log')
                    ideas_dicts.append(i)

                if ideas_dicts:
                    print(f"  > Raw INSERT {len(ideas_dicts)} Ideas...")
                    stmt = text("""
                        INSERT INTO idea (id, title, content, signal_type, status, is_useful, potential_value, tags, created_at, sender_id, recipient_company_id, ai_analysis_log)
                        VALUES (:id, :title, :content, :signal_type, :status, :is_useful, :potential_value, :tags, :created_at, :sender_id, :recipient_company_id, :ai_analysis_log)
                    """)
                    conn.execute(stmt, ideas_dicts)
                    conn.commit()
                
                # Messages
                print("  > preparing Message data...")
                if messages_data:
                    print(f"  > Raw INSERT {len(messages_data)} Messages...")
                    stmt = text("""
                        INSERT INTO message (id, idea_id, sender_type, content, created_at)
                        VALUES (:id, :idea_id, :sender_type, :content, :created_at)
                    """)
                    conn.execute(stmt, messages_data)
                    conn.commit()
            
            print("\n[SUCCESS] Migration Complete! All systems operational on PostgreSQL.")
            
        except Exception as e:
            print(f"  [ERROR] Migration Failed: {e}")
            db.session.rollback()

if __name__ == "__main__":
    migrate()
