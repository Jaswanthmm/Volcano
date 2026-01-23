from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Company
import random
import string
from urllib.parse import urlparse

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# --- Helper Functions ---
def generate_alien_id():
    """Generates a random Alien ID like 'ALIEN-X7Z9'"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ALIEN-{suffix}"

# --- Alien Routes ---

@auth_bp.route('/alien/register', methods=['POST'], strict_slashes=False)
def register_alien():
    print(f"DEBUG: Hit register_alien with data: {request.get_json()}", flush=True)
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name') # Optional but requested

    if not email or not password or not name:
        return jsonify({"error": "Email, password, and name are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # Generate unique Alien ID
    alien_id = generate_alien_id()
    while User.query.filter_by(username=alien_id).first():
        alien_id = generate_alien_id()

    new_alien = User(
        username=alien_id,
        email=email,
        name=name,
        password_hash=generate_password_hash(password)
    )

    db.session.add(new_alien)
    db.session.commit()

    return jsonify({
        "message": "Alien registered successfully",
        "alien_id": alien_id,
        "name": name,
        "role": "alien"
    }), 201

@auth_bp.route('/alien/login', methods=['POST'])
def login_alien():
    data = request.get_json()
    identifier = data.get('identifier') # Can be email or Alien ID
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"error": "Identifier and password are required"}), 400

    # Try to find user by email or username (Alien ID)
    alien = User.query.filter((User.email == identifier) | (User.username == identifier)).first()

    if alien and check_password_hash(alien.password_hash, password):
        return jsonify({
            "message": "Login successful",
            "alien_id": alien.username,
            "email": alien.email,
            "role": "alien"
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# --- Boardroom Routes ---

@auth_bp.route('/boardroom/register', methods=['POST'])
def register_boardroom():
    data = request.get_json()
    company_name = data.get('company_name')
    email = data.get('email')
    password = data.get('password')
    website_url = data.get('website_url')

    if not company_name or not email or not password or not website_url:
        return jsonify({"error": "Company name, email, password, and website URL are required"}), 400

    # Domain Validation (Email)
    email_domain = email.split('@')[-1].lower()
    BLACKLISTED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']
    
    if email_domain in BLACKLISTED_DOMAINS:
        return jsonify({"error": "Public email domains are not strictly authorized for Boardroom access. Please use corporate credentials."}), 403

    if Company.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409
    
    if Company.query.filter_by(company_name=company_name).first():
        return jsonify({"error": "Company name already registered"}), 409

    if Company.query.filter_by(website_url=website_url).first():
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
        "role": "titan"
    }), 201

@auth_bp.route('/boardroom/login', methods=['POST'])
def login_boardroom():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    company = Company.query.filter_by(email=email).first()

    if company and check_password_hash(company.password_hash, password):
        return jsonify({
            "message": "Boardroom access granted",
            "company_name": company.company_name,
            "id": company.id,
            "email": company.email,
            "logo_url": company.logo_url,
            "website_url": company.website_url,
            "role": "titan"
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401
