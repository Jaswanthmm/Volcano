# Core Flask application entry point, configuration, and blueprint registration.
import os
import re
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from local .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'), override=True)

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from ideas import ideas_bp
from auth import auth_bp
from users import users_bp
from messages import messages_bp
from volcano import volcano_bp
from companies import companies_bp

app = Flask(__name__)

# --- CORS Configuration (SEC-04) ---
# Parse allowed origins from environment variable, supporting local dev and Cloud Run domains
raw_origins = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8001,http://127.0.0.1:8001'
)
allowed_origins = [o.strip() for o in raw_origins.split(',') if o.strip()]

# Include Cloud Run pattern if not explicitly wildcard
origin_patterns = [re.compile(r"^https:\/\/.*\.run\.app$")]
for origin in allowed_origins:
    if origin == "*":
        origin_patterns.append(re.compile(r".*"))
    else:
        origin_patterns.append(origin)

CORS(
    app,
    resources={r"/*": {"origins": origin_patterns}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# --- JWT Configuration (SEC-01) ---
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'volcano-super-secret-jwt-key-change-in-prod')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=int(os.getenv('JWT_ACCESS_EXPIRES_HOURS', '24')))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=int(os.getenv('JWT_REFRESH_EXPIRES_DAYS', '30')))
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_callback(callback):
    return jsonify({
        "error": "Missing Authorization Token",
        "details": callback
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    return jsonify({
        "error": "Invalid Authorization Token",
        "details": callback
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        "error": "Authorization Token Expired",
        "details": "Please re-authenticate or refresh your session"
    }), 401

@app.errorhandler(500)
def internal_error(e):
    print(f"500 ERROR: {e}")
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

from flask_migrate import Migrate

basedir = os.path.abspath(os.path.dirname(__file__))

DEFAULT_SUPABASE_POSTGRES_URL = "postgresql://postgres.qmniopmybnzfoldnxtet:Er1GiAYYoHkKZMqj@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

def configure_database(target_app, database_url=None):
    if database_url is None:
        database_url = os.getenv('DATABASE_URL')
    
    # Sanitize and normalize database URL
    if database_url:
        database_url = database_url.strip()
        # Strip surrounding quotes if present
        if (database_url.startswith('"') and database_url.endswith('"')) or \
           (database_url.startswith("'") and database_url.endswith("'")):
            database_url = database_url[1:-1].strip()
        
        # Strip accidental 'DATABASE_URL=' prefix if user pasted key=value into Secret Manager
        if database_url.startswith("DATABASE_URL="):
            database_url = database_url.split("DATABASE_URL=", 1)[1].strip()
            if (database_url.startswith('"') and database_url.endswith('"')) or \
               (database_url.startswith("'") and database_url.endswith("'")):
                database_url = database_url[1:-1].strip()

    # Enforce PostgreSQL: default to verified Supabase connection if DATABASE_URL is not provided
    if not database_url:
        database_url = DEFAULT_SUPABASE_POSTGRES_URL

    # For isolated unit testing: allow sqlite:///:memory:
    if database_url == 'sqlite:///:memory:':
        target_app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        target_app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
        target_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        return

    # Normalize to postgresql:// scheme
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    # Ensure sslmode=require for Supabase / remote PostgreSQL if not already present
    if "supabase.com" in database_url and "sslmode=" not in database_url:
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}sslmode=require"

    target_app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    
    # Resilient Postgres Connection Pooling to prevent connection exhaustion (DB-03)
    target_app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")), # recycle idle connections every 30m
        "pool_pre_ping": True, # verify connection before checkout to prevent broken pipe
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
    }
    target_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database strictly with PostgreSQL (No local SQLite fallbacks)
configure_database(app)
db.init_app(app)

migrate = Migrate(app, db)

app.register_blueprint(ideas_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(volcano_bp)
app.register_blueprint(companies_bp)

# Development fallback table creation (production uses `flask db upgrade`)
with app.app_context():
    try:
        db.create_all()
        print("Database tables verified.")
    except Exception as e:
        print(f"CRITICAL WARNING: Database initialization failed: {e}")


@app.route('/')
def home():
    return jsonify({"status": "online", "service": "Volcano Backend API"})

@app.route('/healthz')
@app.route('/api/health')
def health_check():
    """
    Deep health check verifying application and database connectivity.
    Returns 200 OK when operational, 503 Service Unavailable if database is down.
    """
    health = {
        "status": "healthy",
        "service": "Volcano Backend API",
        "database": {
            "status": "connected",
            "dialect": db.engine.dialect.name
        }
    }
    status_code = 200
    try:
        from sqlalchemy import text
        # Execute query to test database read
        db.session.execute(text('SELECT 1')).scalar()
        
        from models import User, Company, Idea
        health["database"]["metrics"] = {
            "users": User.query.count(),
            "companies": Company.query.count(),
            "ideas": Idea.query.count()
        }
    except Exception as e:
        health["status"] = "unhealthy"
        health["database"]["status"] = "disconnected"
        health["database"]["error"] = str(e)
        status_code = 503

    return jsonify(health), status_code

if __name__ == '__main__':
    from waitress import serve
    print("Serving Volcano Backend on http://0.0.0.0:8001 via Waitress...")
    serve(app, host='0.0.0.0', port=8001)
