from flask import Blueprint, jsonify
from models import db, User, Idea

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/aliens', methods=['GET'])
def list_aliens():
    """List all aliens with basic stats for the Talent Scout view"""
    aliens = User.query.all() # In a real app, filter by role='alien' if roles table existed, but here we assume User model is mostly aliens
    
    results = []
    for alien in aliens:
        total_signals = Idea.query.filter_by(sender_id=alien.id).count()
        accepted_signals = Idea.query.filter_by(sender_id=alien.id, status='accepted').count()
        
        reputation = 0
        if total_signals > 0:
            reputation = int((accepted_signals / total_signals) * 100)

        results.append({
            "id": alien.id,
            "username": alien.username,
            "email": alien.email,
            "total_signals": total_signals,
            "accepted_signals": accepted_signals,
            "reputation": reputation
        })
    
    # Sort by Reputation descending
    results.sort(key=lambda x: x['reputation'], reverse=True)
    
    return jsonify(results), 200

@users_bp.route('/alien/<alien_username>', methods=['GET'])
def get_alien_profile(alien_username):
    """Get detailed profile for a specific alien"""
    alien = User.query.filter_by(username=alien_username).first()
    if not alien:
         # Try email fallback logic handled in previous components if identifier passed
         alien = User.query.filter_by(email=alien_username).first()
    
    if not alien:
        return jsonify({"error": "Alien not found"}), 404

    # Get Accepted Signals (Portfolio)
    portfolio = Idea.query.filter_by(sender_id=alien.id, status='accepted').order_by(Idea.created_at.desc()).all()
    
    portfolio_data = []
    for idea in portfolio:
        # Fetch Company Name
        from models import Company
        company = Company.query.get(idea.recipient_company_id)
        
        portfolio_data.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "company_id": idea.recipient_company_id,
            "company_name": company.company_name if company else "Unknown Node",
            "created_at": idea.created_at.isoformat(),
            "potential_value": idea.potential_value,
            "tags": idea.tags
        })

    return jsonify({
        "id": alien.id,
        "username": alien.username,
        "joined_at": "Unknown", # Add created_at to User model later if needed
        "portfolio": portfolio_data
    }), 200
