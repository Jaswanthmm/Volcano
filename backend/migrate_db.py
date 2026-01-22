import sqlite3

# Connect to the database
conn = sqlite3.connect('ideas.db')
cursor = conn.cursor()

try:
    # Add logo_url column
    print("Attempting to add logo_url column...")
    cursor.execute("ALTER TABLE company ADD COLUMN logo_url VARCHAR(500)")
    conn.commit()
    print("Success: logo_url column added.")
except sqlite3.OperationalError as e:
    print(f"Operation skipped: {e}")

conn.close()
