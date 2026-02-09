import os
from flask import Flask, jsonify
from models import db
from ideas import ideas_bp

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'ideas.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
app.register_blueprint(ideas_bp)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return jsonify({"message": "Test Server with DB and Ideas"})

if __name__ == '__main__':
    app.run(debug=False, port=8000, host='0.0.0.0')
