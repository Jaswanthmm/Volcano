
import os
from flask import Flask
from models import db
from sqlalchemy import text
from app import app

def migrate_auth_schema():
    print("Starting Auth Schema Migration...")
    
    with app.app_context():
        # 1. Add columns to 'user' table
        print("Migrating 'user' table...")
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);"))
                conn.execute(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;"))
                conn.execute(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;"))
                conn.commit()
            print(" - Added phone_number, is_email_verified, is_phone_verified to 'user'")
        except Exception as e:
            print(f" - Error updating 'user': {e}")

        # 2. Add columns to 'company' table
        print("Migrating 'company' table...")
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE company ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);"))
                conn.execute(text("ALTER TABLE company ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;"))
                conn.execute(text("ALTER TABLE company ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;"))
                conn.commit()
            print(" - Added phone_number, is_email_verified, is_phone_verified to 'company'")
        except Exception as e:
            print(f" - Error updating 'company': {e}")

        # 3. Create 'verification_code' table
        print("Creating 'verification_code' table...")
        try:
            # We can use db.create_all() but it only creates tables that don't exist.
            # Since 'verification_code' is new, this should work.
            db.create_all()
            print(" - Created 'verification_code' table (if it didn't exist)")
        except Exception as e:
            print(f" - Error creating table: {e}")
            
    print("Migration Complete.")

if __name__ == "__main__":
    migrate_auth_schema()
