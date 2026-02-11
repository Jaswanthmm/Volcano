
import os
import psycopg2
from dotenv import load_dotenv

# Load .env manually to get connection string
load_dotenv('backend/.env')
db_url = os.getenv('DATABASE_URL')

try:
    print(f"Testing connection to: {db_url.split('@')[-1]}") # Hide password
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    ver = cur.fetchone()
    conn.close()
    print(f"[SUCCESS] Connected to {ver[0]}")
except Exception as e:
    print(f"[FAILURE] {e}")
