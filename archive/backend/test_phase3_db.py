# Automated Test Suite for Volcano Phase 3: Database & Infrastructure Hardening (DB-01 to DB-04)
import pytest
import os
import re

os.environ['JWT_SECRET_KEY'] = 'test-secret-jwt-key-32-bytes-long-for-hmac-sha256!'
os.environ['VOLCANO_ADMIN_KEY'] = 'test_volcano_admin'
os.environ['DATABASE_URL'] = 'postgresql://test_user:test_pass@localhost:5432/test_db'

from app import app, db
from models import User, Company, Idea, Message
from sqlalchemy import inspect

def test_db_01_flask_migrate_integration():
    """DB-01: Verify Flask-Migrate and Alembic directory and configuration"""
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    assert os.path.exists(migrations_dir), "migrations/ directory should exist"
    
    versions_dir = os.path.join(migrations_dir, 'versions')
    assert os.path.exists(versions_dir), "migrations/versions/ directory should exist"
    
    version_files = [f for f in os.listdir(versions_dir) if f.endswith('.py') and not f.startswith('__')]
    assert len(version_files) >= 1, "At least one Alembic migration script must be generated"
    
    # Verify migration file defines indexes and upgrades
    with open(os.path.join(versions_dir, version_files[0]), 'r', encoding='utf-8') as f:
        content = f.read()
        assert "def upgrade():" in content
        assert "def downgrade():" in content
        assert "idx_idea_recipient_status" in content

def test_db_02_strategic_database_indexes():
    """DB-02: Verify strategic indexes defined on SQLAlchemy models"""
    # 1. Idea indexes
    idea_table = Idea.__table__
    idea_index_names = {idx.name for idx in idea_table.indexes}
    assert 'idx_idea_recipient_status' in idea_index_names, "idx_idea_recipient_status missing on Idea"
    assert 'idx_idea_sender_created' in idea_index_names, "idx_idea_sender_created missing on Idea"

    # Verify indexed columns on Idea
    recipient_status_idx = next(idx for idx in idea_table.indexes if idx.name == 'idx_idea_recipient_status')
    assert [c.name for c in recipient_status_idx.columns] == ['recipient_company_id', 'status']

    sender_created_idx = next(idx for idx in idea_table.indexes if idx.name == 'idx_idea_sender_created')
    assert [c.name for c in sender_created_idx.columns] == ['sender_id', 'created_at']

    # 2. User indexes
    user_table = User.__table__
    user_index_names = {idx.name for idx in user_table.indexes}
    assert 'idx_user_username_email' in user_index_names, "idx_user_username_email missing on User"

    # 3. Company indexes
    company_table = Company.__table__
    company_index_names = {idx.name for idx in company_table.indexes}
    assert 'idx_company_name_email' in company_index_names, "idx_company_name_email missing on Company"

    # 4. Message indexes
    message_table = Message.__table__
    message_index_names = {idx.name for idx in message_table.indexes}
    assert 'idx_message_idea_created' in message_index_names, "idx_message_idea_created missing on Message"

def test_db_03_postgres_connection_pooling_configuration():
    """DB-03: Verify SQLAlchemy engine pooling parameters for Postgres"""
    from flask import Flask
    test_app = Flask(__name__)
    from app import configure_database
    
    configure_database(test_app, database_url='postgresql://test_user:test_pass@localhost:5432/test_db')
    engine_options = test_app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {})
    
    assert engine_options.get('pool_pre_ping') is True, "pool_pre_ping should be True to prevent broken pipes"
    assert engine_options.get('pool_size') >= 5, "pool_size should be configured for connection pooling"
    assert engine_options.get('max_overflow') >= 10, "max_overflow should allow surge connections"
    assert engine_options.get('pool_recycle') >= 300, "pool_recycle should be configured to prevent stale connections"
    assert engine_options.get('pool_timeout') >= 10, "pool_timeout should be configured"

def test_db_04_container_optimization():
    """DB-04: Verify multi-stage Dockerfiles and non-root security enforcement"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dockerfile = os.path.join(base_dir, 'backend', 'Dockerfile')
    frontend_dockerfile = os.path.join(base_dir, 'frontend', 'Dockerfile')
    backend_dockerignore = os.path.join(base_dir, 'backend', '.dockerignore')
    frontend_dockerignore = os.path.join(base_dir, 'frontend', '.dockerignore')

    # Verify .dockerignore files exist
    assert os.path.exists(backend_dockerignore), "backend/.dockerignore must exist"
    assert os.path.exists(frontend_dockerignore), "frontend/.dockerignore must exist"

    # Verify backend Dockerfile
    with open(backend_dockerfile, 'r', encoding='utf-8') as f:
        backend_content = f.read()
        assert "AS builder" in backend_content, "Backend Dockerfile must use multi-stage builder"
        assert "AS runner" in backend_content, "Backend Dockerfile must define runner stage"
        assert "USER" in backend_content, "Backend Dockerfile must enforce non-root user"
        assert "useradd" in backend_content or "10001" in backend_content

    # Verify frontend Dockerfile
    with open(frontend_dockerfile, 'r', encoding='utf-8') as f:
        frontend_content = f.read()
        assert "AS builder" in frontend_content, "Frontend Dockerfile must use multi-stage builder"
        assert "AS runner" in frontend_content, "Frontend Dockerfile must define runner stage"
        assert "USER nginx" in frontend_content, "Frontend Dockerfile must run as non-root user"
