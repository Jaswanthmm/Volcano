import os
from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from auth import auth_bp
from ideas import ideas_bp
from users import users_bp

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'ideas.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
app.register_blueprint(auth_bp)
app.register_blueprint(ideas_bp)
app.register_blueprint(users_bp)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Aliens vs Sharks API"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
