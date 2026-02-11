# API routes for User (Alien) profile management and stats.
from flask import Blueprint, jsonify, request
from models import db, User, Idea, Company

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/aliens', methods=['GET'])
def list_aliens():
    """List all aliens with basic stats for the Talent Scout view"""
    # In a real app, we would filter by a role. Here we assume all Users are aliens.
    aliens = User.query.all()
    
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
            "reputation": reputation,
            # Initials for avatar
            "initial": alien.username[0].upper() if alien.username else "?"
        })
    
    # Sort by Reputation descending
    results.sort(key=lambda x: x['reputation'], reverse=True)
    
    return jsonify(results), 200

@users_bp.route('/alien/<alien_identifier>', methods=['GET'])
def get_alien_profile(alien_identifier):
    """Get detailed profile for a specific alien by ID or Username"""
    
    # Try by ID first if integer-like
    alien = None
    if alien_identifier.isdigit():
        alien = User.query.get(int(alien_identifier))
    
    # Try by username
    if not alien:
        alien = User.query.filter_by(username=alien_identifier).first()
        
    if not alien:
        return jsonify({"error": "Alien not found"}), 404

    # Calculate Stats
    total_signals = Idea.query.filter_by(sender_id=alien.id).count()
    accepted_signals = Idea.query.filter_by(sender_id=alien.id, status='accepted').count()
    rejected_signals = Idea.query.filter_by(sender_id=alien.id, status='rejected').count()
    volcano_rejected = Idea.query.filter_by(sender_id=alien.id, status='volcano_rejected').count()
    
    reputation = 0
    if total_signals > 0:
        reputation = int((accepted_signals / total_signals) * 100)

    # Get Portfolio (Accepted Ideas)
    portfolio = Idea.query.filter_by(sender_id=alien.id, status='accepted')\
        .order_by(Idea.created_at.desc()).all()
    
    portfolio_data = []
    for idea in portfolio:
        company = Company.query.get(idea.recipient_company_id)
        portfolio_data.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "company_name": company.company_name if company else "Unknown Node",
            "company_logo_url": company.logo_url if company else None,
            "potential_value": idea.potential_value,
            "created_at": idea.created_at.isoformat(),
            "tags": idea.tags
        })

    # Get Recent Activity (Last 5 signals regardless of status)
    recent = Idea.query.filter_by(sender_id=alien.id)\
        .order_by(Idea.created_at.desc()).limit(5).all()
        
    recent_activity = []
    for idea in recent:
        company = Company.query.get(idea.recipient_company_id)
        recent_activity.append({
            "id": idea.id,
            "title": idea.title,
            "status": idea.status, # processing, volcano_rejected, sent_to_boardroom, accepted, rejected
            "company_name": company.company_name if company else "Unknown",
            "created_at": idea.created_at.isoformat()
        })

    return jsonify({
        "id": alien.id,
        "username": alien.username,
        "email": alien.email,
        "joined_at": "2026-01-01", # Placeholder until migration
        "stats": {
            "reputation": reputation,
            "total_signals": total_signals,
            "accepted": accepted_signals,
            "rejected": rejected_signals,
            "filtered": volcano_rejected
        },
        "portfolio": portfolio_data,
        "recent_activity": recent_activity
    }), 200
