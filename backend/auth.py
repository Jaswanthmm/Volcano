# Authentication routes for Alien and Boardroom registration and login.
import os
import re
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
from models import db, User, Company, OtpVerification
from datetime import datetime, timedelta
from otp_service import (
    generate_otp_code,
    send_email_otp,
    send_sms_otp,
    normalize_phone,
    is_dev_mode
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# --- Helper Functions ---
def generate_alien_id():
    """Generates a random Alien ID like 'ALIEN-X7Z9'"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ALIEN-{suffix}"

from sqlalchemy import func

def verify_registration_otps_helper(email, phone, email_otp, phone_otp, role):
    """
    Validates dual verification OTPs for registration.
    Returns (True, None) if valid, or (False, error_message).
    """
    email_clean = (email or '').strip().lower()
    phone_norm = normalize_phone(phone)
    purpose = f"{role}_registration"

    if not email_clean or not phone_norm:
        return False, "Both email and phone number are required for verification."

    # Look up latest OTP records
    email_rec = OtpVerification.query.filter_by(
        target=email_clean, target_type='email', purpose=purpose
    ).order_by(OtpVerification.id.desc()).first()

    phone_rec = OtpVerification.query.filter_by(
        target=phone_norm, target_type='phone', purpose=purpose
    ).order_by(OtpVerification.id.desc()).first()

    if not email_rec or not phone_rec:
        return False, "Verification codes not found. Please request verification codes first."

    # If already verified recently (within 15 minutes)
    if email_rec.is_verified and phone_rec.is_verified:
        return True, None

    now = datetime.utcnow()
    if now > email_rec.expires_at:
        return False, "Email verification code has expired. Please request a new code."
    if now > phone_rec.expires_at:
        return False, "SMS verification code has expired. Please request a new code."

    if email_rec.attempts >= 5 or phone_rec.attempts >= 5:
        return False, "Too many failed attempts. Please request fresh verification codes."

    code_email = (email_otp or '').strip()
    code_phone = (phone_otp or '').strip()

    email_ok = (email_rec.otp_code == code_email)
    phone_ok = (phone_rec.otp_code == code_phone)

    if not email_ok or not phone_ok:
        if not email_ok:
            email_rec.attempts += 1
        if not phone_ok:
            phone_rec.attempts += 1
        db.session.commit()
        if not email_ok and not phone_ok:
            return False, "Invalid Email and SMS verification codes."
        elif not email_ok:
            return False, "Invalid Email verification code."
        else:
            return False, "Invalid SMS verification code."

    # Mark as verified
    email_rec.is_verified = True
    phone_rec.is_verified = True
    db.session.commit()
    return True, None

def is_phone_already_registered(phone: str, role: str) -> bool:
    """
    Checks if a phone number is already registered in the system.
    Normalizes digits and compares suffix (last 10 digits) to prevent duplicate registrations
    regardless of formatting (spaces, dashes, country code prefix).
    """
    if not phone:
        return False
    digits = "".join(ch for ch in phone if ch.isdigit())
    if not digits:
        return False
    search_suffix = digits[-10:] if len(digits) >= 10 else digits

    if role == 'alien':
        clean_col = func.replace(func.replace(func.replace(User.phone, ' ', ''), '-', ''), '+', '')
        return User.query.filter(clean_col.like(f"%{search_suffix}")).first() is not None
    elif role == 'boardroom':
        clean_col = func.replace(func.replace(func.replace(Company.phone, ' ', ''), '-', ''), '+', '')
        return Company.query.filter(clean_col.like(f"%{search_suffix}")).first() is not None
    return False

def normalize_company_website(url: str) -> str:
    """
    Extracts only the canonical root domain (e.g., 'flipkart.com') from any URL or domain input.
    Handles schemes ('http://', 'https://'), prefixes ('www.'), paths, ports, query strings, and trailing slashes.
    Example:
      'www.flipkart.com' -> 'flipkart.com'
      'https://www.flipkart.com/' -> 'flipkart.com'
      'http://flipkart.com/about' -> 'flipkart.com'
    """
    if not url:
        return ''
    clean = url.strip().lower()
    if not clean.startswith(('http://', 'https://')):
        clean = 'https://' + clean
    try:
        parsed = urlparse(clean)
        domain = parsed.netloc or parsed.path
        domain = domain.split(':')[0]
        domain = domain.split('/')[0]
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain.strip().strip('/')
    except Exception:
        clean = clean.replace('https://', '').replace('http://', '')
        if clean.startswith('www.'):
            clean = clean[4:]
        return clean.split('/')[0].split(':')[0].strip().strip('/')

LEGAL_SUFFIX_PATTERNS = [
    r'\bprivate\s+limited\b',
    r'\bpvt\.?\s*ltd\.?\b',
    r'\bpvt\b',
    r'\bincorporated\b',
    r'\binc\.?\b',
    r'\bcorporation\b',
    r'\bcorp\.?\b',
    r'\blimited\b',
    r'\bltd\.?\b',
    r'\bllc\.?\b',
    r'\bl\.l\.c\.?\b',
    r'\bcompany\b',
    r'\bco\.?\b',
    r'\bholdings\b',
    r'\bholding\b',
    r'\benterprises\b',
    r'\benterprise\b',
    r'\btechnologies\b',
    r'\btech\b',
    r'\bsolutions\b',
    r'\bglobal\b',
    r'\bgroup\b',
    r'\bventures\b'
]

KNOWN_MULTI_TLDS = {
    'co.in', 'com.in', 'net.in', 'org.in', 'gen.in', 'ind.in',
    'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk',
    'com.au', 'net.au', 'org.au',
    'co.nz', 'net.nz', 'org.nz',
    'co.za', 'com.sg', 'com.br', 'co.jp', 'com.tw', 'com.hk'
}

def normalize_company_name(name: str) -> str:
    """
    Normalizes company names by lowercasing, stripping punctuation, and removing
    common corporate suffixes (Inc, Ltd, Corp, LLC, Pvt Ltd, etc.) to prevent duplicate
    and brand-spoofing registrations.
    Example:
      'Flipkart Inc' -> 'flipkart'
      'Flipkart Pvt Ltd' -> 'flipkart'
      'Flipkart' -> 'flipkart'
    """
    if not name:
        return ''
    cleaned = name.lower().strip()
    cleaned = re.sub(r'[,.\-_/\\()&]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    changed = True
    while changed:
        changed = False
        for pattern in LEGAL_SUFFIX_PATTERNS:
            new_cleaned = re.sub(pattern + r'\s*$', '', cleaned, flags=re.IGNORECASE).strip()
            if new_cleaned and new_cleaned != cleaned:
                cleaned = new_cleaned
                changed = True
    return re.sub(r'\s+', ' ', cleaned).strip()

def extract_domain_brand(domain: str) -> str:
    """
    Extracts the root brand/SLD label from a domain across any TLD or ccTLD.
    Example:
      'flipkart.com' -> 'flipkart'
      'flipkart.in' -> 'flipkart'
      'flipkart.co.in' -> 'flipkart'
      'careers.flipkart.com' -> 'flipkart'
    """
    if not domain:
        return ''
    d = domain.strip().lower()
    d = re.sub(r'^[a-zA-Z]+://', '', d)
    if d.startswith('www.'):
        d = d[4:]
    d = d.split('/')[0].split(':')[0].strip()
    
    parts = d.split('.')
    if len(parts) <= 1:
        return d
    
    last_two = '.'.join(parts[-2:])
    if last_two in KNOWN_MULTI_TLDS and len(parts) >= 3:
        return parts[-3]
    return parts[-2]

def find_conflicting_company_name(name: str):
    """
    Finds if an existing company has an exact or normalized matching brand name.
    """
    if not name:
        return None
    raw_clean = name.strip().lower()
    norm_name = normalize_company_name(name)
    
    # 1. Exact case-insensitive match
    exact = Company.query.filter(func.lower(Company.company_name) == raw_clean).first()
    if exact:
        return exact
        
    # 2. Normalized brand name match
    all_comps = Company.query.all()
    for comp in all_comps:
        if comp.company_name:
            if normalize_company_name(comp.company_name) == norm_name:
                return comp
    return None

def find_conflicting_company_website(website_url: str):
    """
    Finds if an existing company has the same canonical domain or root brand SLD
    across different TLDs (e.g. flipkart.in vs flipkart.com).
    """
    if not website_url:
        return None
    norm_website = normalize_company_website(website_url)
    if not norm_website:
        return None
        
    # 1. Exact canonical domain match
    exact = Company.query.filter(func.lower(Company.website_url) == norm_website.lower()).first()
    if exact:
        return exact
        
    input_brand = extract_domain_brand(norm_website)
    
    all_comps = Company.query.all()
    for comp in all_comps:
        if not comp.website_url:
            continue
        existing_norm = normalize_company_website(comp.website_url)
        if existing_norm == norm_website:
            return comp
        # Cross-TLD brand match (e.g. flipkart.in vs flipkart.com)
        if input_brand and len(input_brand) >= 2:
            existing_brand = extract_domain_brand(existing_norm)
            if existing_brand == input_brand:
                return comp
    return None

def is_company_website_registered(norm_website: str) -> bool:
    return find_conflicting_company_website(norm_website) is not None

# --- OTP Routes ---

@auth_bp.route('/otp/send-registration', methods=['POST'])
def send_registration_otps():
    data = request.get_json() or {}
    role = (data.get('role') or 'alien').strip().lower()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()

    if not email or '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({"error": "Valid email address is required"}), 400

    phone_norm = normalize_phone(phone)
    if not phone_norm or not phone_norm.startswith("+") or " " not in phone_norm:
        return jsonify({"error": "Phone number must follow standard format: +91 1234567890"}), 400

    parts = phone_norm.split(" ", 1)
    if len(parts) != 2 or len(parts[1]) < 7 or len(parts[1]) > 12:
        return jsonify({"error": "Phone number must follow standard format: +91 1234567890"}), 400

    if role == 'alien':
        if User.query.filter(func.lower(User.email) == email).first():
            return jsonify({"error": "Email is already registered"}), 409
        if is_phone_already_registered(phone_norm, 'alien'):
            return jsonify({"error": "Phone number is already registered"}), 409
    elif role == 'boardroom':
        email_domain = email.split('@')[-1].lower() if '@' in email else ''
        BLACKLISTED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']
        if email_domain in BLACKLISTED_DOMAINS:
            return jsonify({"error": "Public email domains are not strictly authorized for Boardroom access. Please use corporate credentials."}), 403

        if Company.query.filter(func.lower(Company.email) == email).first():
            return jsonify({"error": "Email is already registered"}), 409

        if is_phone_already_registered(phone_norm, 'boardroom'):
            return jsonify({"error": "Phone number is already registered"}), 409

        company_name = (data.get('company_name') or '').strip()
        if company_name:
            conflict_name = find_conflicting_company_name(company_name)
            if conflict_name:
                return jsonify({
                    "error": f"Company name '{company_name}' conflicts with registered organization '{conflict_name.company_name}'"
                }), 409

        website_raw = (data.get('website_url') or '').strip()
        norm_website = normalize_company_website(website_raw)
        if norm_website:
            if '.' not in norm_website:
                return jsonify({"error": "Please provide a valid company website domain (e.g. company.com)"}), 400
            conflict_web = find_conflicting_company_website(norm_website)
            if conflict_web:
                return jsonify({
                    "error": f"Company domain conflicts with registered organization '{conflict_web.company_name}' ({conflict_web.website_url})"
                }), 409
    else:
        return jsonify({"error": "Invalid role specified"}), 400

    # Generate 2 distinct 6-digit OTPs
    email_code = generate_otp_code(6)
    phone_code = generate_otp_code(6)
    while phone_code == email_code:
        phone_code = generate_otp_code(6)

    expires_at = datetime.utcnow() + timedelta(minutes=10)
    purpose = f"{role}_registration"

    # Purge old unverified OTPs for this target + purpose
    try:
        OtpVerification.query.filter_by(target=email, purpose=purpose).delete()
        OtpVerification.query.filter_by(target=phone_norm, purpose=purpose).delete()
    except Exception as e:
        print(f"[OTP WARNING] Could not clear old OTPs: {e}")

    email_rec = OtpVerification(
        target=email,
        target_type='email',
        channel='email',
        otp_code=email_code,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        is_verified=False
    )
    phone_rec = OtpVerification(
        target=phone_norm,
        target_type='phone',
        channel='sms',
        otp_code=phone_code,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        is_verified=False
    )

    db.session.add(email_rec)
    db.session.add(phone_rec)
    db.session.commit()

    # Dispatch via configured channels
    email_res = send_email_otp(email, email_code, role=role)
    phone_res = send_sms_otp(phone_norm, phone_code, role=role)

    dev_active = is_dev_mode() or email_res.get("simulated", False) or phone_res.get("simulated", False)

    return jsonify({
        "message": "Dual verification codes dispatched to your email and phone via SMS",
        "email": email,
        "phone": phone_norm,
        "dev_mode": dev_active,
        "dev_email_otp": email_code if dev_active else None,
        "dev_phone_otp": phone_code if dev_active else None,
        "expires_in_seconds": 600
    }), 200

@auth_bp.route('/otp/verify-registration', methods=['POST'])
def verify_registration_otps():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    email_otp = (data.get('email_otp') or '').strip()
    phone_otp = (data.get('phone_otp') or '').strip()
    role = (data.get('role') or 'alien').strip().lower()

    if not email or not phone or not email_otp or not phone_otp:
        return jsonify({"error": "Email, phone number, email OTP, and phone OTP are required"}), 400

    valid, err_msg = verify_registration_otps_helper(email, phone, email_otp, phone_otp, role)
    if not valid:
        return jsonify({"error": err_msg}), 400

    return jsonify({
        "success": True,
        "message": "Email and SMS verification successful. You may now complete registration."
    }), 200

# --- Alien Routes ---

@auth_bp.route('/alien/register', methods=['POST'], strict_slashes=False)
def register_alien():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    email_otp = (data.get('email_otp') or '').strip()
    phone_otp = (data.get('phone_otp') or '').strip()

    if not email or not password or not name or not phone:
        return jsonify({"error": "Email, password, name, and phone number are required"}), 400

    # Dual OTP verification
    valid, err_msg = verify_registration_otps_helper(email, phone, email_otp, phone_otp, role="alien")
    if not valid:
        return jsonify({"error": err_msg}), 400

    phone_norm = normalize_phone(phone)

    # Case-insensitive duplicate email check in PostgreSQL
    if User.query.filter(func.lower(User.email) == email).first():
        return jsonify({"error": "Email already registered"}), 409

    # Duplicate phone number check
    if is_phone_already_registered(phone_norm, 'alien'):
        return jsonify({"error": "Phone number already registered"}), 409

    # Generate unique Alien ID
    alien_id = generate_alien_id()
    while User.query.filter(func.upper(User.username) == alien_id.upper()).first():
        alien_id = generate_alien_id()

    new_alien = User(
        username=alien_id,
        email=email,
        name=name,
        phone=phone_norm,
        password_hash=generate_password_hash(password),
        is_verified=True
    )

    db.session.add(new_alien)
    db.session.commit()

    return jsonify({
        "message": "Alien registered and verified successfully",
        "alien_id": alien_id,
        "name": name,
        "phone": phone_norm,
        "is_verified": True,
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
    website_raw = (data.get('website_url') or '').strip()
    phone = (data.get('phone') or '').strip()
    email_otp = (data.get('email_otp') or '').strip()
    phone_otp = (data.get('phone_otp') or '').strip()

    if not company_name or not email or not password or not website_raw or not phone:
        return jsonify({"error": "Company name, email, password, website URL, and phone number are required"}), 400

    norm_website = normalize_company_website(website_raw)
    if not norm_website or '.' not in norm_website:
        return jsonify({"error": "Please provide a valid company website domain (e.g. company.com)"}), 400

    # Dual OTP verification
    valid, err_msg = verify_registration_otps_helper(email, phone, email_otp, phone_otp, role="boardroom")
    if not valid:
        return jsonify({"error": err_msg}), 400

    # Domain Validation (Email)
    email_domain = email.split('@')[-1].lower() if '@' in email else ''
    BLACKLISTED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']
    
    if email_domain in BLACKLISTED_DOMAINS:
        return jsonify({"error": "Public email domains are not strictly authorized for Boardroom access. Please use corporate credentials."}), 403

    phone_norm = normalize_phone(phone)

    if Company.query.filter(func.lower(Company.email) == email).first():
        return jsonify({"error": "Email already registered"}), 409
    
    if is_phone_already_registered(phone_norm, 'boardroom'):
        return jsonify({"error": "Phone number already registered"}), 409

    conflict_name = find_conflicting_company_name(company_name)
    if conflict_name:
        return jsonify({
            "error": f"Company name '{company_name}' conflicts with registered organization '{conflict_name.company_name}'"
        }), 409

    conflict_web = find_conflicting_company_website(norm_website)
    if conflict_web:
        return jsonify({
            "error": f"Company domain conflicts with registered organization '{conflict_web.company_name}' ({conflict_web.website_url})"
        }), 409

    # Auto-fetch Logo using Canonical Domain
    logo_url = f"https://www.google.com/s2/favicons?domain={norm_website}&sz=128"

    new_company = Company(
        company_name=company_name,
        email=email,
        phone=phone_norm,
        password_hash=generate_password_hash(password),
        logo_url=logo_url,
        website_url=norm_website,
        is_verified=True
    )

    db.session.add(new_company)
    db.session.commit()

    return jsonify({
        "message": "Boardroom entity registered and verified successfully",
        "company_name": company_name,
        "id": new_company.id,
        "logo_url": logo_url,
        "phone": phone_norm,
        "is_verified": True,
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


# --- Forgot Password Routes ---

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return email
    user_part, domain = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 6:
        return phone
    parts = phone.split(" ", 1)
    if len(parts) == 2:
        cc, num = parts[0], parts[1]
        if len(num) > 4:
            masked_num = num[:2] + "*" * (len(num) - 4) + num[-2:]
            return f"{cc} {masked_num}"
    return phone[:3] + "*" * (len(phone) - 5) + phone[-2:]

@auth_bp.route('/forgot-password/request', methods=['POST'])
def forgot_password_request():
    data = request.get_json() or {}
    role = (data.get('role') or 'alien').strip().lower()
    identifier = (data.get('identifier') or '').strip()

    if not identifier:
        label = "Alien ID or Email" if role == 'alien' else "Corporate Email"
        return jsonify({"error": f"Please provide your {label}."}), 400

    target_email = None
    target_phone = None
    account_name = None

    if role == 'alien':
        alien = User.query.filter(
            (func.lower(User.email) == identifier.lower()) | 
            (func.upper(User.username) == identifier.upper())
        ).first()
        if not alien:
            return jsonify({"error": "No Alien identity found matching this identifier or email."}), 404
        target_email = alien.email
        target_phone = alien.phone
        account_name = alien.name or alien.username
    elif role in ('boardroom', 'titan'):
        role = 'boardroom'
        company = Company.query.filter(func.lower(Company.email) == identifier.lower()).first()
        if not company:
            company = Company.query.filter(func.lower(Company.company_name) == identifier.lower()).first()
        if not company:
            return jsonify({"error": "No registered organization found matching this corporate email."}), 404
        target_email = company.email
        target_phone = company.phone
        account_name = company.company_name
    else:
        return jsonify({"error": "Invalid role specified."}), 400

    otp_code = generate_otp_code(6)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    purpose = f"{role}_password_reset"

    # Purge old unverified OTPs for this target + purpose
    try:
        OtpVerification.query.filter_by(target=target_email, purpose=purpose).delete()
        if target_phone:
            OtpVerification.query.filter_by(target=target_phone, purpose=purpose).delete()
        db.session.commit()
    except Exception as e:
        print(f"[OTP WARNING] Could not clear old reset OTPs: {e}")
        db.session.rollback()

    email_rec = OtpVerification(
        target=target_email,
        target_type='email',
        channel='email',
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        is_verified=False
    )
    db.session.add(email_rec)

    if target_phone:
        phone_rec = OtpVerification(
            target=target_phone,
            target_type='phone',
            channel='sms',
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
            attempts=0,
            is_verified=False
        )
        db.session.add(phone_rec)

    db.session.commit()

    email_res = send_email_otp(target_email, otp_code, role=role, action="password_reset")
    phone_res = {"simulated": True}
    if target_phone:
        phone_res = send_sms_otp(target_phone, otp_code, role=role, action="password_reset")

    dev_active = is_dev_mode() or email_res.get("simulated", False) or phone_res.get("simulated", False)

    return jsonify({
        "message": f"Security clearance verification code dispatched for {account_name}.",
        "target_email": mask_email(target_email),
        "target_phone": mask_phone(target_phone) if target_phone else None,
        "dev_mode": dev_active,
        "dev_otp": otp_code if dev_active else None,
        "expires_in_seconds": 600
    }), 200

@auth_bp.route('/forgot-password/reset', methods=['POST'])
def forgot_password_reset():
    data = request.get_json() or {}
    role = (data.get('role') or 'alien').strip().lower()
    identifier = (data.get('identifier') or '').strip()
    otp_code = (data.get('otp_code') or '').strip()
    new_password = (data.get('new_password') or '').strip()

    if not identifier:
        return jsonify({"error": "Identifier is required."}), 400
    if not otp_code or len(otp_code) != 6:
        return jsonify({"error": "Please provide the valid 6-digit verification code."}), 400
    if not new_password or len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters in length."}), 400

    target_email = None
    user_entity = None

    if role == 'alien':
        user_entity = User.query.filter(
            (func.lower(User.email) == identifier.lower()) | 
            (func.upper(User.username) == identifier.upper())
        ).first()
        if not user_entity:
            return jsonify({"error": "No Alien identity found."}), 404
        target_email = user_entity.email
    elif role in ('boardroom', 'titan'):
        role = 'boardroom'
        user_entity = Company.query.filter(func.lower(Company.email) == identifier.lower()).first()
        if not user_entity:
            user_entity = Company.query.filter(func.lower(Company.company_name) == identifier.lower()).first()
        if not user_entity:
            return jsonify({"error": "No registered organization found."}), 404
        target_email = user_entity.email
    else:
        return jsonify({"error": "Invalid role specified."}), 400

    purpose = f"{role}_password_reset"
    otp_rec = OtpVerification.query.filter_by(
        target=target_email,
        purpose=purpose,
        is_verified=False
    ).order_by(OtpVerification.created_at.desc()).first()

    if not otp_rec:
        return jsonify({"error": "No active reset request found. Please request a new code."}), 400

    if otp_rec.expires_at < datetime.utcnow():
        return jsonify({"error": "The reset code has expired. Please request a fresh code."}), 400

    if otp_rec.attempts >= 5:
        return jsonify({"error": "Maximum verification attempts exceeded. Please request a new code."}), 400

    if otp_rec.otp_code != otp_code:
        otp_rec.attempts += 1
        db.session.commit()
        remaining = 5 - otp_rec.attempts
        return jsonify({"error": f"Invalid code. {remaining} attempt(s) remaining."}), 400

    # Mark OTP as verified & update password
    otp_rec.is_verified = True
    user_entity.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({
        "message": "Password updated successfully! You may now sign in with your new credentials."
    }), 200


