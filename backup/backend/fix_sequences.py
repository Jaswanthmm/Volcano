# Critical utility to reset PostgreSQL auto-increment sequences after data import.

from dotenv import load_dotenv
import os

# Load env explicitly BEFORE importing app
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

from app import app
from models import db
from sqlalchemy import text

def fix_sequences():
    print("--- FIXING POSTGRESQL SEQUENCES ---")
    with app.app_context():
        # List of tables to fix
        tables = ['user', 'company', 'idea', 'message']
        
        for table in tables:
            print(f"Fixing sequence for table: {table}...")
            try:
                # PostgreSQL specific command to reset sequence
                # We assume the sequence name follows the default convention: table_id_seq
                # We need to wrap table name in quotes if it's reserved, but these are simple.
                # Actually, sqlalchemy might quote them. safely using "user"
                
                query = text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(max(id), 0) + 1, false) FROM \"{table}\";")
                
                db.session.execute(query)
                db.session.commit()
                print(f"✓ Sequence for '{table}' reset successfully.")
                
            except Exception as e:
                print(f"❌ Failed to reset sequence for '{table}': {e}")
                db.session.rollback()

if __name__ == "__main__":
    fix_sequences()
