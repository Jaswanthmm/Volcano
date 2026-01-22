from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_verified = db.Column(db.Boolean, default=False)
    # ideas = db.relationship('Idea', backref='author', lazy=True)

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_verified = db.Column(db.Boolean, default=False)
    logo_url = db.Column(db.String(500)) # URL to company logo
    # ideas_received = db.relationship('Idea', backref='target_company', lazy=True)

class Idea(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, accepted, rejected
    is_useful = db.Column(db.Boolean, default=False)
    potential_value = db.Column(db.String(50)) # e.g. "$50,000"
    tags = db.Column(db.String(200)) # e.g. "Tech, AI"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
