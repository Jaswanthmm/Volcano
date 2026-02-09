from app import app
from models import db, Company

with app.app_context():
    companies = Company.query.all()
    print(f"Total Companies Found: {len(companies)}")
    for c in companies:
        print(f"- {c.id}: {c.company_name} | {c.email}")
