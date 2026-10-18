# Authentication routes for Alien and Boardroom registration and login.
import os
import random
import string
from urllib.parse import urlparse
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from models import db, User, Company

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# --- Helper Functions ---
def generate_alien_id():
    """Generates a random Alien ID like 'ALIEN-X7Z9'"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ALIEN-{suffix}"

from sqlalchemy import func

# --- Alien Routes ---

@auth_bp.route('/alien/register', methods=['POST'], strict_slashes=False)
def register_alien():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()

    if not email or not password or not name:
        return jsonify({"error": "Email, password, and name are required"}), 400

    # Case-insensitive duplicate email check in PostgreSQL
    if User.query.filter(func.lower(User.email) == email).first():
        return jsonify({"error": "Email already registered"}), 409

    # Generate unique Alien ID
    alien_id = generate_alien_id()
    while User.query.filter(func.upper(User.username) == alien_id.upper()).first():
        alien_id = generate_alien_id()

    new_alien = User(
        username=alien_id,
        email=email,
        name=name,
        phone=phone,
        password_hash=generate_password_hash(password)
    )

    db.session.add(new_alien)
    db.session.commit()

    return jsonify({
        "message": "Alien registered successfully",
        "alien_id": alien_id,
        "name": name,
        "phone": phone,
        "role": "alien"
    }), 201

@auth_bp.route('/alien/login', methods=['POST'])
def login_alien():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or '').strip() # Can be email or Alien ID
    password = (data.get('password') or '').strip()

    if not identifier or not password:
        return jsonify({"error": "Identifier and password are required"}), 400

    # Case-insensitive lookup matching either normalized email or Alien ID (username)
    alien = User.query.filter(
        (func.lower(User.email) == identifier.lower()) | 
        (func.upper(User.username) == identifier.upper())
    ).first()

    if alien and check_password_hash(alien.password_hash, password):
        identity = str(alien.id)
        claims = {
            "role": "alien",
            "alien_id": alien.username,
            "email": alien.email,
            "name": alien.name
        }
        access_token = create_access_token(identity=identity, additional_claims=claims)
        refresh_token = create_refresh_token(identity=identity, additional_claims=claims)

        user_info = {
            "id": alien.id,
            "alien_id": alien.username,
            "email": alien.email,
            "name": alien.name,
            "role": "alien"
        }

        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_info": user_info,
            "alien_id": alien.username,
            "email": alien.email,
            "role": "alien"
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# --- Boardroom Routes ---

@auth_bp.route('/boardroom/register', methods=['POST'])
def register_boardroom():
    data = request.get_json() or {}
    company_name = (data.get('company_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    website_url = (data.get('website_url') or '').strip().lower()
    phone = (data.get('phone') or '').strip()

    if not company_name or not email or not password or not website_url:
        return jsonify({"error": "Company name, email, password, and website URL are required"}), 400

    # Domain Validation (Email)
    email_domain = email.split('@')[-1].lower() if '@' in email else ''
    BLACKLISTED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']
    
    if email_domain in BLACKLISTED_DOMAINS:
        return jsonify({"error": "Public email domains are not strictly authorized for Boardroom access. Please use corporate credentials."}), 403

    if Company.query.filter(func.lower(Company.email) == email).first():
        return jsonify({"error": "Email already registered"}), 409
    
    if Company.query.filter(func.lower(Company.company_name) == company_name.lower()).first():
        return jsonify({"error": "Company name already registered"}), 409

    if Company.query.filter(func.lower(Company.website_url) == website_url).first():
        return jsonify({"error": "Company website already verified in our database"}), 409

    # Auto-fetch Logo using Website URL
    try:
        parsed_url = urlparse(website_url)
        domain = parsed_url.netloc or parsed_url.path # handle cases like 'stripe.com' vs 'https://stripe.com'
        if domain.startswith('www.'):
            domain = domain[4:]
    except:
        domain = website_url # Fallback

    logo_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"

    new_company = Company(
        company_name=company_name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        logo_url=logo_url,
        website_url=website_url
    )

    db.session.add(new_company)
    db.session.commit()

    return jsonify({
        "message": "Boardroom entity registered successfully",
        "company_name": company_name,
        "id": new_company.id,
        "logo_url": logo_url,
        "phone": phone,
        "role": "titan"
    }), 201

@auth_bp.route('/boardroom/login', methods=['POST'])
def login_boardroom():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    company = Company.query.filter(func.lower(Company.email) == email).first()

    if company and check_password_hash(company.password_hash, password):
        identity = str(company.id)
        claims = {
            "role": "titan",
            "company_id": company.id,
            "company_name": company.company_name,
            "email": company.email
        }
        access_token = create_access_token(identity=identity, additional_claims=claims)
        refresh_token = create_refresh_token(identity=identity, additional_claims=claims)

        user_info = {
            "id": company.id,
            "company_name": company.company_name,
            "email": company.email,
            "logo_url": company.logo_url,
            "website_url": company.website_url,
            "role": "titan"
        }

        return jsonify({
            "message": "Boardroom access granted",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_info": user_info,
            "company_name": company.company_name,
            "id": company.id,
            "email": company.email,
            "logo_url": company.logo_url,
            "website_url": company.website_url,
            "role": "titan"
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# --- Admin Routes (SEC-03) ---

@auth_bp.route('/admin/login', methods=['POST'])
def login_admin():
    data = request.get_json() or {}
    password = data.get('password') or data.get('access_code')

    if not password:
        return jsonify({"error": "Admin access key required"}), 400

    admin_key = os.getenv('VOLCANO_ADMIN_KEY', 'volcano_admin')
    if password != admin_key:
        return jsonify({"error": "ACCESS DENIED. INVALID CRYPTO KEY."}), 401

    identity = "admin"
    claims = {
        "role": "admin",
        "username": "admin"
    }
    access_token = create_access_token(identity=identity, additional_claims=claims)
    refresh_token = create_refresh_token(identity=identity, additional_claims=claims)

    user_info = {
        "role": "admin",
        "username": "admin"
    }

    return jsonify({
        "message": "Admin authorization granted",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_info": user_info
    }), 200

# --- Token Refresh & Current User ---

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    identity = get_jwt_identity()
    claims = get_jwt()
    # Retain role and custom claims
    additional_claims = {
        k: v for k, v in claims.items()
        if k not in ['fresh', 'iat', 'jti', 'type', 'sub', 'nbf', 'exp']
    }
    new_access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    return jsonify({
        "access_token": new_access_token,
        "token_type": "Bearer"
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_profile():
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role == 'alien':
        user = db.session.get(User, int(identity))
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({
            "id": user.id,
            "alien_id": user.username,
            "email": user.email,
            "name": user.name,
            "role": "alien"
        }), 200
    elif role == 'titan':
        company = db.session.get(Company, int(identity))
        if not company:
            return jsonify({"error": "Company not found"}), 404
        return jsonify({
            "id": company.id,
            "company_name": company.company_name,
            "email": company.email,
            "logo_url": company.logo_url,
            "website_url": company.website_url,
            "role": "titan"
        }), 200
    elif role == 'admin':
        return jsonify({
            "role": "admin",
            "username": "admin"
        }), 200

    return jsonify({"error": "Invalid role claim"}), 400

