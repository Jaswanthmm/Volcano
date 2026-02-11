# API routes for messaging between Aliens and Boardrooms (Titans).
from flask import Blueprint, request, jsonify
from models import db, Message, Idea, Company, User
from datetime import datetime

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

@messages_bp.route('/', methods=['POST'])
def send_message():
    data = request.get_json()
    idea_id = data.get('idea_id')
    sender_type = data.get('sender_type') # 'titan' or 'alien'
    content = data.get('content')

    if not idea_id or not sender_type or not content:
        return jsonify({"error": "Missing required fields"}), 400

    # Verify Idea exists
    idea = Idea.query.get(idea_id)
    if not idea:
        return jsonify({"error": "Idea not found"}), 404

    new_message = Message(
        idea_id=idea_id,
        sender_type=sender_type,
        content=content
    )

    db.session.add(new_message)
    db.session.commit()

    return jsonify({
        "message": "Message sent successfully",
        "id": new_message.id,
        "created_at": new_message.created_at.isoformat()
    }), 201

@messages_bp.route('/<int:idea_id>', methods=['GET'])
def get_messages(idea_id):
    # Verify Idea exists
    idea = Idea.query.get(idea_id)
    if not idea:
        return jsonify({"error": "Idea not found"}), 404
        
    messages = Message.query.filter_by(idea_id=idea_id).order_by(Message.created_at.asc()).all()
    
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "sender_type": msg.sender_type,
            "content": msg.content,
            "created_at": msg.created_at.isoformat()
        })

    return jsonify(result), 200
