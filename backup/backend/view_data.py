
import os
import sys

# Add backend directory to sys.path to ensure modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import User, Company, Idea, Message
from sqlalchemy import text

def print_table(headers, rows):
    # Calculate column widths
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            max_len = 50 # Limit max width
            val_str = str(val)
            if len(val_str) > max_len:
                val_str = val_str[:max_len-3] + "..."
            col_widths[i] = max(col_widths[i], len(val_str))

    # Create format string
    fmt = " | ".join(["{{:<{}}}".format(w) for w in col_widths])
    
    # Print header
    print("-" * (sum(col_widths) + 3 * (len(headers) - 1)))
    print(fmt.format(*headers))
    print("-" * (sum(col_widths) + 3 * (len(headers) - 1)))
    
    # Print rows
    for row in rows:
        formatted_row = []
        for val in row:
            val_str = str(val)
            if len(val_str) > 50:
                val_str = val_str[:47] + "..."
            formatted_row.append(val_str)
        print(fmt.format(*formatted_row))
    print("-" * (sum(col_widths) + 3 * (len(headers) - 1)))

def view_data():
    with app.app_context():
        print("\n=== DATABASE CONFIGURATION ===")
        print(f"URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        while True:
            print("\nSelect Table to View:")
            print("1. Users (Aliens)")
            print("2. Companies (Titans)")
            print("3. Ideas (Signals)")
            print("4. Messages")
            print("5. Exit")
            
            choice = input("\nEnter choice (1-5): ")
            
            if choice == '1':
                users = User.query.order_by(User.id).all()
                headers = ["ID", "Username", "Name", "Email", "Verified"]
                rows = [[u.id, u.username, u.name, u.email, u.is_verified] for u in users]
                print(f"\n--- USERS ({len(users)}) ---")
                print_table(headers, rows)
                
            elif choice == '2':
                companies = Company.query.order_by(Company.id).all()
                headers = ["ID", "Name", "Website", "Email"]
                rows = [[c.id, c.company_name, c.website_url, c.email] for c in companies]
                print(f"\n--- COMPANIES ({len(companies)}) ---")
                print_table(headers, rows)
                
            elif choice == '3':
                ideas = Idea.query.order_by(Idea.id.desc()).limit(20).all() # Show last 20
                headers = ["ID", "Title", "Status", "Sender ID", "Company ID"]
                rows = [[i.id, i.title, i.status, i.sender_id, i.recipient_company_id] for i in ideas]
                print(f"\n--- IDEAS (Last 20) ---")
                print_table(headers, rows)
                
            elif choice == '4':
                messages = Message.query.order_by(Message.id.desc()).limit(20).all()
                headers = ["ID", "Idea ID", "Sender", "Content"]
                rows = [[m.id, m.idea_id, m.sender_type, m.content] for m in messages]
                print(f"\n--- MESSAGES (Last 20) ---")
                print_table(headers, rows)
                
            elif choice == '5':
                print("Exiting...")
                break
            else:
                print("Invalid choice, please try again.")

if __name__ == "__main__":
    try:
        view_data()
    except KeyboardInterrupt:
        print("\nExited.")
