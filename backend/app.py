# Core Flask application entry point, configuration, and blueprint registration.
import os
from flask import Flask, jsonify
from flask_cors import CORS
# from models import db
# from ideas import ideas_bp
# from auth import auth_bp
# from users import users_bp
# from messages import messages_bp
# from volcano import volcano_bp
# from companies import companies_bp

app = Flask(__name__)
# Enable CORS for all domains with credentials support
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.errorhandler(500)
def internal_error(e):
    print(f"500 ERROR: {e}")
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

basedir = os.path.abspath(os.path.dirname(__file__))

# Database / Blueprints Disabled for Debugging
# ...

@app.route('/')
def home():
    return jsonify({"status": "online", "service": "Volcano Backend API (Debug Mode)"})

if __name__ == '__main__':
    app.run(debug=True, port=8001, host='0.0.0.0')
