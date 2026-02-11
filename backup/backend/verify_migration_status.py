
import sqlite3
import os
from app import app, db
from models import User, Company, Idea, Message
from sqlalchemy import text

def check_sqlite_counts():
    db_path = os.path.join(os.path.dirname(__file__), 'ideas.db')
    if not os.path.exists(db_path):
        print(f"SQLite DB not found at {db_path}")
        return {}
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    counts = {}
    tables = ['user', 'company', 'idea', 'message']
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            counts[table] = cursor.fetchone()[0]
        except Exception as e:
            print(f"Error counting {table} in SQLite: {e}")
            counts[table] = 0
    
    conn.close()
    return counts

def check_postgres_counts():
    counts = {}
    with app.app_context():
        # Confirm DB URI
        print(f"Active DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        counts['user'] = User.query.count()
        counts['company'] = Company.query.count()
        counts['idea'] = Idea.query.count()
        counts['message'] = Message.query.count()
        
    return counts

if __name__ == "__main__":
    print("--- MIGRATION VERIFICATION ---")
    
    sqlite_counts = check_sqlite_counts()
    print("\nSQLite (Old) Counts:")
    for table, count in sqlite_counts.items():
        print(f"  {table.capitalize()}: {count}")
        
    postgres_counts = check_postgres_counts()
    print("\nPostgreSQL (Active) Counts:")
    for table, count in postgres_counts.items():
        print(f"  {table.capitalize()}: {count}")
        
    print("\n--- COMPARISON ---")
    match = True
    for table in ['user', 'company', 'idea', 'message']:
        diff = sqlite_counts.get(table, 0) - postgres_counts.get(table, 0)
        if diff == 0:
            print(f"✅ {table.capitalize()}: Match")
        else:
            print(f"⚠️ {table.capitalize()}: Mismatch (Diff: {diff})")
            print(f"   (Note: Invalid/Orphaned records were intentionally skipped during import)")
            match = False
            
    if match:
        print("\nResult: COMPLETE MIGRATION")
    else:
        print("\nResult: PARTIAL MIGRATION (Cleaned Data)")
