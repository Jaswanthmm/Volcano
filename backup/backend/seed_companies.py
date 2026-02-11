from app import app
from models import db, Company
from werkzeug.security import generate_password_hash

def seed_companies():
    with app.app_context():
        # Clear existing companies
        print("Clearing existing companies...")
        try:
            db.session.query(Company).delete()
            db.session.commit()
            print("Existing companies cleared.")
        except Exception as e:
            db.session.rollback()
            print(f"Error clearing companies: {e}")
            return

        # Define new companies with logos
        # Define new companies with logos
        companies_data = [
            {
                "name": "VerifyCorp",
                "email": "contact@verifycorp.com",
                "logo": "https://ui-avatars.com/api/?name=VerifyCorp&background=0D8ABC&color=fff&size=128",
                "website": "https://verifycorp.com"
            },
            {
                "name": "NeuroLink",
                "email": "info@neurolink.tech",
                "logo": "https://ui-avatars.com/api/?name=NeuroLink&background=6D28D9&color=fff&size=128",
                "website": "https://neurolink.tech"
            },
            {
                "name": "Stripe Inc",
                "email": "support@stripe.com",
                "logo": "https://www.google.com/s2/favicons?domain=stripe.com&sz=128",
                "website": "https://stripe.com"
            },
            {
                "name": "Alpha Industries",
                "email": "alpha@industries.com",
                "logo": "https://ui-avatars.com/api/?name=Alpha&background=ef4444&color=fff&size=128",
                "website": "https://alpha.com"
            },
            {
                "name": "Swiggy",
                "email": "partners@swiggy.com",
                "logo": "https://www.google.com/s2/favicons?domain=swiggy.com&sz=128",
                "website": "https://swiggy.com"
            },
            {
                "name": "Zepto",
                "email": "delivery@zepto.com",
                "logo": "https://www.google.com/s2/favicons?domain=zepto.com&sz=128",
                "website": "https://zeptonow.com"
            }
        ]

        print("Seeding new companies...")
        for c in companies_data:
            new_company = Company(
                company_name=c['name'],
                email=c['email'],
                password_hash=generate_password_hash('123'), # Default password
                is_verified=True,
                logo_url=c['logo'],
                website_url=c['website']
            )
            db.session.add(new_company)

        try:
            db.session.commit()
            print(f"Successfully seeded {len(companies_data)} companies.")
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding companies: {e}")

if __name__ == "__main__":
    seed_companies()
