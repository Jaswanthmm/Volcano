# Utility script to create the 'volcano_db' PostgreSQL database if it doesn't exist.
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Credentials provided by user
user = "postgres"
password = "dbpostgres"
host = "localhost"

# Connect to default 'postgres' database to create new DB
try:
    print("Connecting to 'postgres' database...")
    conn = psycopg2.connect(
        user=user,
        password=password,
        host=host,
        port="5432",
        database="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    db_name = "volcano_db"
    
    # Check if exists
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
    exists = cursor.fetchone()
    
    if not exists:
        print(f"Creating database '{db_name}'...")
        cursor.execute(f"CREATE DATABASE {db_name};")
        print("Database created successfully!")
    else:
        print(f"Database '{db_name}' already exists.")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error creating database: {e}")
