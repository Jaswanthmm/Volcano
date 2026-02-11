
import psycopg2
from psycopg2 import OperationalError

def create_connection(db_name, db_user, db_password, db_host, db_port):
    connection = None
    try:
        connection = psycopg2.connect(
            database=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
        )
        print("Connection to PostgreSQL DB successful")
    except OperationalError as e:
        print(f"The error '{e}' occurred")
    return connection

# Common passwords to try
passwords = ['password', 'postgres', 'admin', 'root', '123456']
user = 'postgres'
host = 'localhost'
port = '5432'
db_name = 'volcano_db' # Trying specific DB first

for pwd in passwords:
    print(f"Trying password: '{pwd}'...")
    conn = create_connection(db_name, user, pwd, host, port)
    if conn:
        print(f"SUCCESS! Password is: {pwd}")
        print(f"DATABASE_URL=postgresql://{user}:{pwd}@{host}:{port}/{db_name}")
        conn.close()
        break
    else:
        # Try connecting to default 'postgres' db just to check auth
        print(f"  (volcano_db failed, trying default 'postgres' db with '{pwd}')...")
        conn_default = create_connection('postgres', user, pwd, host, port)
        if conn_default:
            print(f"SUCCESS (connected to 'postgres' DB)! Password is: {pwd}")
            print(f"Warning: 'volcano_db' might not exist yet.")
            print(f"DATABASE_URL=postgresql://{user}:{pwd}@{host}:{port}/{db_name}") 
            conn_default.close()
            break
