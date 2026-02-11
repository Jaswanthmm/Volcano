import sqlite3

def migrate():
    conn = sqlite3.connect('ideas.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE idea ADD COLUMN ai_analysis_log TEXT")
        print("Successfully added ai_analysis_log column to idea table.")
    except sqlite3.OperationalError as e:
        print(f"Migration check: {e} (Column might already exist)")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
