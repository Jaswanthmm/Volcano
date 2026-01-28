from flask import Blueprint, request, jsonify
from models import db, Idea, User, Company
from analysis import analyze_signal

ideas_bp = Blueprint('ideas', __name__, url_prefix='/api/ideas')

@ideas_bp.route('/submit', methods=['POST'])
def submit_idea():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
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

    # 3. Context Retrieval (RAG-lite)
    # Fetch last 10 ideas for this company to check for duplicates
    recent_ideas = Idea.query.filter_by(recipient_company_id=company.id)\
        .order_by(Idea.created_at.desc()).limit(20).all()
    
    recent_ideas_context = [f"Title: {i.title}, Content: {i.content}" for i in recent_ideas]

    # 4. AI Analysis
    print(f"Analyzing signal for {company_name}...")
    analysis = analyze_signal(title, content, company_name, recent_ideas_context)
    
    if not analysis['valid']:
        return jsonify({
            "error": "Signal Filtered by AI System", 
            "details": analysis['reason']
        }), 400

    new_idea = Idea(
        title=title,
        content=content,
        sender_id=sender.id,
        recipient_company_id=company.id,
        signal_type=signal_type,
        status='pending',
        is_useful=True, # AI said it's valid
        potential_value=analysis['value'],
        tags=analysis['tags']
    )

    db.session.add(new_idea)
    db.session.commit()

    return jsonify({
        "message": "Signal transmitted successfully",
        "signal_id": new_idea.id,
        "status": "pending",
        "signal_type": signal_type,
        "potential_value": analysis['value'],
        "tags": analysis['tags']
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
            "company_name": company.company_name if company else "Unknown",
            "company_logo_url": company.logo_url if company else None,
            "potential_value": idea.potential_value,
            "tags": idea.tags,
            "created_at": idea.created_at.isoformat()
        })

    return jsonify(results), 200

@ideas_bp.route('/companies', methods=['GET'])
def get_companies():
    companies = Company.query.all()
    results = [{"id": c.id, "name": c.company_name, "logo_url": c.logo_url} for c in companies]
    return jsonify(results), 200

@ideas_bp.route('/company/<int:company_id>', methods=['GET'])
def get_company_ideas(company_id):
    ideas = Idea.query.filter_by(recipient_company_id=company_id).order_by(Idea.created_at.desc()).all()
    
    results = []
    for idea in ideas:
        sender = User.query.get(idea.sender_id)
        results.append({
            "id": idea.id,
            "title": idea.title,
            "content": idea.content,
            "status": idea.status,
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
