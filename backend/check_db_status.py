from app import app
from models import db, User, Company, Idea

def check_data():
    with app.app_context():
        user_count = User.query.count()
        company_count = Company.query.count()
        idea_count = Idea.query.count()
        
        print(f"Users: {user_count}")
        print(f"Companies: {company_count}")
        print(f"Ideas: {idea_count}")
        
        print("\n--- Users ---")
        for u in User.query.all():
            print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")
            
        print("\n--- Companies ---")
        for c in Company.query.all():
            print(f"ID: {c.id}, Name: {c.company_name}")
            
        print("\n--- Recent Ideas ---")
        for i in Idea.query.order_by(Idea.id.desc()).limit(5).all():
            print(f"ID: {i.id}, Title: {i.title}, Status: {i.status}, Sender: {i.sender_id}, Company: {i.recipient_company_id}")

if __name__ == "__main__":
    check_data()
