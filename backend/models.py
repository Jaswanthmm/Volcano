# SQLAlchemy database models for User, Company, Idea, and Message entities.
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True) # Actual name of the Alien
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(30), nullable=True) # Contact Phone Number
    password_hash = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    
    __table_args__ = (
        db.Index('idx_user_username_email', 'username', 'email'),
    )

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(30), nullable=True) # Representative Phone Number
    password_hash = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    logo_url = db.Column(db.String(500)) # URL to company logo
    website_url = db.Column(db.String(200), unique=True) # Official company website

    __table_args__ = (
        db.Index('idx_company_name_email', 'company_name', 'email'),
    )

class Idea(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    signal_type = db.Column(db.String(50), default='others') # New Feature, Bug, Others
    status = db.Column(db.String(20), default='pending') # pending, accepted, rejected
    is_useful = db.Column(db.Boolean, default=False)
    potential_value = db.Column(db.String(50)) # e.g. "$50,000"
    tags = db.Column(db.String(200)) # e.g. "Tech, AI"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    ai_analysis_log = db.Column(db.Text) # Full reasoning from Volcano

    __table_args__ = (
        db.Index('idx_idea_recipient_status', 'recipient_company_id', 'status'),
        db.Index('idx_idea_sender_created', 'sender_id', 'created_at'),
    )

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('idea.id'), nullable=False)
    sender_type = db.Column(db.String(10), nullable=False) # 'titan' or 'alien'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_message_idea_created', 'idea_id', 'created_at'),
    )

class PipelineLog(db.Model):
    __tablename__ = 'pipeline_log'
    id = db.Column(db.Integer, primary_key=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('idea.id'), unique=True, nullable=False)
    current_agent = db.Column(db.String(100), default="Read & Validate")
    logs = db.Column(db.Text, default="[]") # JSON list of log entries
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_pipeline_log_idea_id', 'idea_id'),
    )

