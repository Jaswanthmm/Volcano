import sqlite3

# Connect to the database
conn = sqlite3.connect('ideas.db')
cursor = conn.cursor()

columns_to_add = [
    ("potential_value", "VARCHAR(50)"),
    ("tags", "VARCHAR(200)"),
    ("signal_type", "VARCHAR(50)")
]

for col_name, col_type in columns_to_add:
    try:
        print(f"Attempting to add {col_name} column to idea table...")
        cursor.execute(f"ALTER TABLE idea ADD COLUMN {col_name} {col_type}")
        conn.commit()
        print(f"Success: {col_name} column added.")
    except sqlite3.OperationalError as e:
        print(f"Operation skipped for {col_name}: {e}")

conn.close()
