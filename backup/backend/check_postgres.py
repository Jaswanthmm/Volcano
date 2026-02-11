
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('DATABASE_URL')
print(f"Testing connection to: {db_url}")

try:
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        exit(1)
        
    conn = psycopg2.connect(db_url)
    print("SUCCESS: Connected to PostgreSQL!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone())
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")
