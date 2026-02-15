import os
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin SDK
# Expects GOOGLE_APPLICATION_CREDENTIALS env var or a serviceAccountKey.json file
# If not present, it might fail or warn. We'll wrap it.

cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH') # Optional specific path

try:
    if not firebase_admin._apps:
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase Admin initialized with creds at {cred_path}")
        else:
            # Try default (looks for GOOGLE_APPLICATION_CREDENTIALS)
            try:
                firebase_admin.initialize_app()
                print("Firebase Admin initialized with default credentials")
            except Exception as e:
                print(f"Warning: Firebase default init failed: {e}. Trying to proceed (Verify might fail if no creds).")
except Exception as e:
    print(f"Error initializing Firebase Admin: {e}")

def verify_token(token):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None
