# API routes for submitting, retrieving, and managing ideas (signals).
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Idea, User, Company, Message

ideas_bp = Blueprint('ideas', __name__, url_prefix='/api/ideas')

@ideas_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_idea():
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role != 'alien':
        return jsonify({"error": "Unauthorized: Only registered Aliens can submit signals"}), 403

    # 1. Strictly bind Sender (Alien) from verified JWT identity
    sender = db.session.get(User, int(identity))
    if not sender:
        return jsonify({"error": "Alien identity not found"}), 404

    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content')
    company_name = data.get('company_name')
    company_id = data.get('recipient_company_id')
    signal_type = data.get('signal_type', 'others')

    if not title or not content or (not company_name and not company_id):
        return jsonify({"error": "Missing required fields (title, content, and target company)"}), 400

    title = str(title).strip()[:200]

    # 2. Find Recipient (Company)
    if company_id:
        company = db.session.get(Company, int(company_id))
    else:
        company = Company.query.filter_by(company_name=company_name).first()

    if not company:
        return jsonify({"error": "Target Boardroom not found"}), 404


    # 3. Create 'Queued' Idea for Worker Process
    new_idea = Idea(
        title=title,
        content=content,
        sender_id=sender.id,
        recipient_company_id=company.id,
        signal_type=signal_type,
        status='queued', # Waiting for worker.py
        is_useful=False, 
        potential_value="Queued...",
        tags="Pending Analysis..."
    )

    db.session.add(new_idea)
    db.session.commit()

    # 4. Asynchronous Queue Processing (WORK-01)
    # The HTTP request completes immediately (<300ms) with 'queued' status.
    # The pipeline is processed by worker.py, Cloud Tasks webhook, or local async dispatcher.
    app_obj = current_app._get_current_object()
    if os.getenv("ASYNC_DISPATCH_LOCAL", "true").lower() == "true":
        from worker import trigger_async_process
        trigger_async_process(app_obj, new_idea.id)

    return jsonify({
        "message": "Signal queued for Volcano analysis.",
        "signal_id": new_idea.id,
        "status": "queued",
        "signal_type": signal_type
    }), 201

@ideas_bp.route('/<int:idea_id>/process', methods=['POST'])
def process_queued_signal_webhook(idea_id):
    """
    Internal execution endpoint for Cloud Tasks webhooks or worker services (WORK-01).
    Protected by internal worker secret or Volcano Admin key.
    """
    provided_secret = (
        request.headers.get('X-Internal-Worker-Secret') 
        or request.headers.get('X-Volcano-Admin-Key')
        or request.args.get('secret')
    )
    expected_secret = os.getenv('INTERNAL_WORKER_SECRET', os.getenv('VOLCANO_ADMIN_KEY', 'volcano_admin'))
    
    if not provided_secret or provided_secret != expected_secret:
        return jsonify({"error": "Unauthorized: Invalid internal worker credentials"}), 403

    from worker import process_signal
    app_obj = current_app._get_current_object()
    success = process_signal(app_obj, idea_id)
    
    if success:
        return jsonify({"status": "completed", "signal_id": idea_id}), 200
    else:
        return jsonify({"status": "failed", "signal_id": idea_id}), 500


@ideas_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_ideas():
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role != 'alien':
        return jsonify({"error": "Unauthorized: Only Alien operatives can view their signals"}), 403

    user = db.session.get(User, int(identity))
    if not user:
        return jsonify({"error": "User not found"}), 404

    my_ideas = Idea.query.filter_by(sender_id=user.id).order_by(Idea.created_at.desc()).all()
    
    results = []
    for idea in my_ideas:
        company = db.session.get(Company, idea.recipient_company_id)
        results.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "status": idea.status,
            "signal_type": idea.signal_type,
            "company_id": company.id if company else None,
            "company_name": company.company_name if company else "Unknown",
            "company_logo_url": company.logo_url if company else None,
            "potential_value": idea.potential_value,
            "tags": idea.tags,
            "analysis_log": idea.ai_analysis_log,
            "created_at": idea.created_at.isoformat()
        })

    return jsonify(results), 200

@ideas_bp.route('/companies', methods=['GET'])
def get_companies():
    try:
        companies = Company.query.all()
        results = [{"id": c.id, "name": c.company_name, "logo_url": c.logo_url} for c in companies]
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e), "type": str(type(e))}), 500

@ideas_bp.route('/company/<int:company_id>', methods=['GET'])
@jwt_required()
def get_company_ideas(company_id):
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    # Allow only the company itself or admin
    if role == 'titan' and int(identity) != company_id:
        return jsonify({"error": "Forbidden: Cannot access signals for another Boardroom entity"}), 403
    elif role not in ['titan', 'admin']:
        return jsonify({"error": "Unauthorized: Boardroom or Admin authorization required"}), 403

    # Only fetch signals that have passed Volcano (or are in legacy valid states)
    # We exclude 'processing' and 'volcano_rejected'
    valid_statuses = ['sent_to_boardroom', 'interesting', 'accepted', 'rejected']
    ideas = Idea.query.filter(
        Idea.recipient_company_id == company_id,
        Idea.status.in_(valid_statuses)
    ).order_by(Idea.created_at.desc()).all()
    
    results = []
    for idea in ideas:
        sender = db.session.get(User, idea.sender_id)
        # Map 'sent_to_boardroom' to 'pending' for Frontend compatibility
        display_status = 'pending' if idea.status == 'sent_to_boardroom' else idea.status
        
        results.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "status": display_status,
            "signal_type": idea.signal_type,
            "sender_identifier": sender.username if sender else "Unknown Alien",
            "sender_name": sender.name if sender and sender.name else "Unknown Entity",
            "created_at": idea.created_at.isoformat()
        })
    return jsonify(results), 200

@ideas_bp.route('/<int:idea_id>/status', methods=['POST'])
@jwt_required()
def update_idea_status(idea_id):
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role not in ['titan', 'admin']:
        return jsonify({"error": "Unauthorized: Only Boardroom Titans or Admins can update signal status"}), 403

    data = request.get_json() or {}
    new_status = data.get('status') # accepted, rejected, interesting

    if new_status not in ['accepted', 'rejected', 'interesting']:
        return jsonify({"error": "Invalid status"}), 400

    idea = db.session.get(Idea, idea_id)
    if not idea:
        return jsonify({"error": "Signal not found"}), 404

    # Enforce company ownership: only the intended company (or admin) can change status
    if role == 'titan' and idea.recipient_company_id != int(identity):
        return jsonify({"error": "Forbidden: Only the recipient Boardroom entity can modify this signal status"}), 403

    idea.status = new_status
    if new_status == 'accepted':
        idea.is_useful = True
    
    db.session.commit()

    return jsonify({"message": f"Signal {new_status}", "new_status": new_status}), 200
