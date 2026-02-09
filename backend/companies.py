from flask import Blueprint, jsonify
from models import db, Company, Idea, User

companies_bp = Blueprint('companies', __name__, url_prefix='/api/companies')

@companies_bp.route('/<int:company_id>/profile', methods=['GET'])
def get_company_profile(company_id):
    """Get detailed profile for a company"""
    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    # Stats
    total_received = Idea.query.filter_by(recipient_company_id=company.id).filter(Idea.status != 'processing').filter(Idea.status != 'volcano_rejected').count()
    accepted_count = Idea.query.filter_by(recipient_company_id=company.id, status='accepted').count()
    rejected_count = Idea.query.filter_by(recipient_company_id=company.id, status='rejected').count()
    
    acceptance_rate = 0
    if total_received > 0:
        acceptance_rate = int((accepted_count / total_received) * 100)

    # Active "Bounties" (Actually just pending ideas for now, but in future could be wishlist)
    # listing waiting signals as "In Review"
    pending_signals = Idea.query.filter_by(recipient_company_id=company.id, status='sent_to_boardroom')\
        .order_by(Idea.created_at.desc()).limit(10).all()
        
    in_review = []
    for idea in pending_signals:
         sender = User.query.get(idea.sender_id)
         in_review.append({
             "id": idea.id,
             "title": idea.title,
             "potential_value": idea.potential_value,
             "created_at": idea.created_at.isoformat(),
             "sender_name": sender.username if sender else "Unknown"
         })

    # Acquisitions (Accepted Ideas)
    acquisitions = Idea.query.filter_by(recipient_company_id=company.id, status='accepted')\
        .order_by(Idea.created_at.desc()).limit(10).all()
        
    acquisition_list = []
    for idea in acquisitions:
        sender = User.query.get(idea.sender_id)
        acquisition_list.append({
             "id": idea.id,
             "title": idea.title,
             "value": idea.potential_value,
             "tags": idea.tags,
             "acquired_from": sender.username if sender else "Unknown",
             "date": idea.created_at.isoformat()
        })

    return jsonify({
        "id": company.id,
        "name": company.company_name,
        "logo_url": company.logo_url,
        "website": company.website_url,
        "stats": {
            "total_received": total_received,
            "accepted": accepted_count,
            "rejected": rejected_count,
            "acceptance_rate": acceptance_rate
        },
        "in_review": in_review,
        "acquisitions": acquisition_list
    }), 200

@companies_bp.route('/', methods=['GET'])
def list_companies():
    """List all companies with basic info"""
    companies = Company.query.all()
    results = []
    for c in companies:
        results.append({
            "id": c.id,
            "name": c.company_name,
            "logo_url": c.logo_url
        })
    return jsonify(results), 200
