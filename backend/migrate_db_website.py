import sqlite3

# Connect to the database
conn = sqlite3.connect('ideas.db')
cursor = conn.cursor()

try:
    # Add website_url column
    # Note: SQLite has limitations on adding UNIQUE constraints via ALTER TABLE on existing tables.
    # We will add the column without the explicit UNIQUE constraint in the DB schema for now,
    # but application logic will enforce uniqueness.
    print("Attempting to add website_url column...")
    cursor.execute("ALTER TABLE company ADD COLUMN website_url VARCHAR(200)")
    conn.commit()
    print("Success: website_url column added.")
except sqlite3.OperationalError as e:
    print(f"Operation skipped (maybe already exists): {e}")

conn.close()
