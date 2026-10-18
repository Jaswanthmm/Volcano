from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Idea, Company, User
from sqlalchemy import desc
from shared_state import ACTIVE_LOGS

volcano_bp = Blueprint('volcano', __name__, url_prefix='/api/volcano')

@volcano_bp.route('/logs/<int:idea_id>', methods=['GET'])
@jwt_required()
def get_live_log(idea_id):
    """
    Returns the real-time processing log for a specific signal.
    Accessible by Admin, the submitting Alien, or the recipient Boardroom.
    """
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({"error": "Signal not found"}), 404

    # Permission check: admin, sender alien, or recipient company
    is_admin = (role == 'admin')
    is_sender = (role == 'alien' and str(idea.sender_id) == str(identity))
    is_recipient = (role == 'titan' and str(idea.recipient_company_id) == str(identity))

    if not (is_admin or is_sender or is_recipient):
        return jsonify({"error": "Access Denied: Insufficient permissions to view these neural logs"}), 403

    if idea_id in ACTIVE_LOGS:
        return jsonify(ACTIVE_LOGS[idea_id]), 200
    else:
        # Check if it's already done (fallback to DB)
        if idea.ai_analysis_log:
             return jsonify({
                 "agents": ["Gatekeeper", "Detective", "Historian", "Visionary"],
                 "current_agent": "COMPLETE",
                 "logs": [idea.ai_analysis_log] 
             }), 200
        return jsonify({"error": "No active or archived logs found"}), 404

@volcano_bp.route('/stream', methods=['GET'])
@jwt_required()
def get_volcano_stream():
    """
    Returns ALL signals passing through Volcano (Processing, Approved, Rejected).
    Restricted to Admins only.
    """
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({"error": "Access Denied: Volcano Cognitive Core stream requires Admin privileges"}), 403

    # Fetch all ideas, newest first
    ideas = Idea.query.order_by(Idea.created_at.desc()).limit(100).all()
    
    results = []
    for idea in ideas:
        sender = db.session.get(User, idea.sender_id)
        recipient = db.session.get(Company, idea.recipient_company_id)
        
        # Decouple Engine Status from Boardroom Status
        display_status = idea.status
        if idea.status in ['interesting', 'accepted', 'rejected']: 
            display_status = 'sent_to_boardroom' # Visually remains "Approved" in Engine

        results.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "status": display_status,
            "signal_type": idea.signal_type,
            "sender": sender.username if sender else "Unknown",
            "recipient": recipient.company_name if recipient else "Unknown",
            "recipient_logo": recipient.logo_url if recipient else None,
            "potential_value": idea.potential_value,
            "tags": idea.tags,
            "analysis_log": idea.ai_analysis_log, # The Decision Engine Output
            "created_at": idea.created_at.isoformat()
        })
        
    return jsonify(results), 200

@volcano_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_volcano_stats():
    """
    Returns global system statistics for Volcano Thinking Engine.
    Restricted to Admins only.
    """
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({"error": "Access Denied: Volcano Cognitive Core stats require Admin privileges"}), 403

    total_signals = Idea.query.count()
    rejected_signals = Idea.query.filter_by(status='volcano_rejected').count()
    approved_signals = Idea.query.filter_by(status='sent_to_boardroom').count()
    processing_signals = Idea.query.filter_by(status='processing').count()
    
    return jsonify({
        "total": total_signals,
        "rejected": rejected_signals,
        "approved": approved_signals,
        "processing": processing_signals
    }), 200
