from flask import Blueprint, request, jsonify, current_app
from models import db, Idea, User, Company, Message
from agents import run_pipeline
import threading

ideas_bp = Blueprint('ideas', __name__, url_prefix='/api/ideas')

def run_volcano_analysis(app, idea_id, company_name, title, content):
    """
    Background Task: The 'Thinking Engine' Pipeline.
    Now powered by Multi-Agent Swarm logic.
    """
    with app.app_context():
        try:
            print(f"Volcano Active: Analyzing Signal #{idea_id} for {company_name}")
            
            # Context Retrieval (Inside Thread)
            company = Company.query.filter_by(company_name=company_name).first()
            if not company:
                print("Error: Company not found in background thread")
                return

            idea = Idea.query.get(idea_id)
            if not idea: 
                return

            recent_ideas = Idea.query.filter_by(recipient_company_id=company.id)\
                .filter(Idea.id != idea_id)\
                .order_by(Idea.created_at.desc()).limit(20).all()
            
            recent_context = [f"Title: {i.title}, Content: {i.content}, Status: {i.status}" for i in recent_ideas]

            # --- RUN AGENT PIPELINE ---
            analysis = run_pipeline(title, content, company_name, recent_context, idea.signal_type, idea_id=idea.id)
            
            # Refetch idea to lock for update (safeguard)
            idea = Idea.query.get(idea_id)
            
            # Save Results
            if analysis['valid']:
                print(f"Pipeline Approved: Signal #{idea_id}")
                idea.status = 'sent_to_boardroom'
                idea.tags = analysis.get('tags', '')
                idea.ai_analysis_log = analysis['log']
            else:
                print(f"Pipeline Rejected: Signal #{idea_id}")
                idea.status = 'volcano_rejected'
                idea.ai_analysis_log = analysis['log'] + f"\n\n[FINAL REJECTION REASON]: {analysis['reason']}"
                
                # Feedback Message
                msg = Message(
                    idea_id=idea.id,
                    sender_type='volcano', 
                    content=f"COGNITIVE CORE ALERT: {analysis['reason']}"
                )
                db.session.add(msg)
            
            db.session.commit()
            print(f"Thinking Complete for Signal #{idea_id}")

        except Exception as e:
            print(f"Volcano Core Failure: {e}")
            # Failsafe
            with app.app_context():
                idea = Idea.query.get(idea_id)
                if idea:
                    idea.status = 'volcano_rejected'
                    idea.ai_analysis_log = f"SYSTEM ERROR: {str(e)}"
                    db.session.commit()

@ideas_bp.route('/submit', methods=['POST'])
def submit_idea():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    sender_identifier = data.get('sender_identifier') # Alien ID or Email
    company_name = data.get('company_name')
    signal_type = data.get('signal_type', 'others')

    if not title or not content or not sender_identifier or not company_name:
        return jsonify({"error": "Missing required fields"}), 400

    # 1. Find Sender (Alien)
    sender = User.query.filter((User.username == sender_identifier) | (User.email == sender_identifier)).first()
    if not sender:
        return jsonify({"error": "Alien identity not found"}), 404

    # 2. Find Recipient (Company)
    company = Company.query.filter_by(company_name=company_name).first()
    if not company:
        return jsonify({"error": "Target Boardroom not found"}), 404

    # 3. Create 'Processing' Idea using valid SQLAlchemy model status
    # Note: 'processing' status might effectively mean 'pending' until changed, 
    # but we will use 'processing' to denote "At Volcano".
    new_idea = Idea(
        title=title,
        content=content,
        sender_id=sender.id,
        recipient_company_id=company.id,
        signal_type=signal_type,
        status='processing', # Initial State
        is_useful=False, 
        potential_value="Analyzing...",
        tags="Verifying..."
    )

    db.session.add(new_idea)
    db.session.commit()

    # 4. Spawn Background Thread (Async Intelligence)
    # Pass 'current_app._get_current_object()' to allow thread to access app_context
    app_instance = current_app._get_current_object()
    threading.Thread(
        target=run_volcano_analysis, 
        args=(app_instance, new_idea.id, company_name, title, content)
    ).start()

    return jsonify({
        "message": "Signal intercepted by Volcano. Processing started.",
        "signal_id": new_idea.id,
        "status": "processing",
        "signal_type": signal_type
    }), 201

@ideas_bp.route('/my', methods=['GET'])
def get_my_ideas():
    identifier = request.args.get('identifier')
    
    if not identifier:
        return jsonify({"error": "Alien identifier required"}), 400

    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    my_ideas = Idea.query.filter_by(sender_id=user.id).order_by(Idea.created_at.desc()).all()
    
    results = []
    for idea in my_ideas:
        company = Company.query.get(idea.recipient_company_id)
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
def get_company_ideas(company_id):
    # Only fetch signals that have passed Volcano (or are in legacy valid states)
    # We exclude 'processing' and 'volcano_rejected'
    valid_statuses = ['sent_to_boardroom', 'interesting', 'accepted', 'rejected']
    ideas = Idea.query.filter(
        Idea.recipient_company_id == company_id,
        Idea.status.in_(valid_statuses)
    ).order_by(Idea.created_at.desc()).all()
    
    results = []
    for idea in ideas:
        sender = User.query.get(idea.sender_id)
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
def update_idea_status(idea_id):
    data = request.get_json()
    new_status = data.get('status') # accepted, rejected, interesting

    if new_status not in ['accepted', 'rejected', 'interesting']:
        return jsonify({"error": "Invalid status"}), 400

    idea = Idea.query.get(idea_id)
    if not idea:
        return jsonify({"error": "Signal not found"}), 404

    idea.status = new_status
    if new_status == 'accepted':
        idea.is_useful = True
    
    db.session.commit()

    return jsonify({"message": f"Signal {new_status}", "new_status": new_status}), 200
