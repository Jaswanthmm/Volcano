import sqlite3

# Connect to the database
conn = sqlite3.connect('ideas.db')
cursor = conn.cursor()

try:
    # Add name column to user table
    print("Attempting to add name column to user table...")
    cursor.execute("ALTER TABLE user ADD COLUMN name VARCHAR(100)")
    conn.commit()
    print("Success: name column added.")
except sqlite3.OperationalError as e:
    print(f"Operation skipped (likely already exists): {e}")

conn.close()
