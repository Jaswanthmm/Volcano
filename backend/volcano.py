from flask import Blueprint, jsonify
from models import Idea, Company, User
from sqlalchemy import desc
from shared_state import ACTIVE_LOGS

volcano_bp = Blueprint('volcano', __name__, url_prefix='/api/volcano')

@volcano_bp.route('/logs/<int:idea_id>', methods=['GET'])
def get_live_log(idea_id):
    """
    Returns the real-time processing log for a specific signal.
    """
    if idea_id in ACTIVE_LOGS:
        return jsonify(ACTIVE_LOGS[idea_id]), 200
    else:
        # Check if it's already done (fallback to DB)
        idea = Idea.query.get(idea_id)
        if idea and idea.ai_analysis_log:
             return jsonify({
                 "agents": ["Gatekeeper", "Detective", "Historian", "Visionary"],
                 "current_agent": "COMPLETE",
                 "logs": [idea.ai_analysis_log] 
             }), 200
        return jsonify({"error": "No active or archived logs found"}), 404

@volcano_bp.route('/stream', methods=['GET'])
def get_volcano_stream():
    """
    Returns ALL signals passing through Volcano (Processing, Approved, Rejected).
    This is the 'God View'.
    """
    # Fetch all ideas, newest first
    ideas = Idea.query.order_by(Idea.created_at.desc()).limit(100).all()
    
    results = []
    for idea in ideas:
        sender = User.query.get(idea.sender_id)
        recipient = Company.query.get(idea.recipient_company_id)
        
        results.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "status": idea.status, # processing, sent_to_boardroom, volcano_rejected, etc.
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
def get_volcano_stats():
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
