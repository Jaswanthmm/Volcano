import os
from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from ideas import ideas_bp
from auth import auth_bp
from users import users_bp
from messages import messages_bp
from volcano import volcano_bp
from companies import companies_bp

app = Flask(__name__)
# Enable CORS for all domains
CORS(app, resources={r"/*": {"origins": "*"}})

@app.errorhandler(500)
def internal_error(e):
    print(f"500 ERROR: {e}")
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'ideas.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
app.register_blueprint(ideas_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(volcano_bp)
app.register_blueprint(companies_bp)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Aliens vs Sharks API"})

if __name__ == '__main__':
    app.run(debug=True, port=8001, host='0.0.0.0')
