
# Utility to export SQLite data to JSON (Part 1 of Safe Migration).
import sqlite3
import json
import os

def get_data(db_path, table):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table}")
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows

def export():
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'ideas.db')
    
    if not os.path.exists(db_path):
        print("Error: ideas.db not found")
        return

    data = {
        "users": get_data(db_path, "user"),
        "companies": get_data(db_path, "company"),
        "ideas": get_data(db_path, "idea"),
        "messages": get_data(db_path, "message")
    }
    
    with open(os.path.join(basedir, 'export_data.json'), 'w') as f:
        json.dump(data, f, default=str) # Handle dates as str
    
    print("SUCCESS: Data exported to export_data.json")

if __name__ == "__main__":
    export()
