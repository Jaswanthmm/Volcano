# Automated Test Suite for Volcano Phase 2: AI Pipeline & Asynchronous Workers (WORK-01 to WORK-04)
import pytest
import os
import json
import time
from unittest.mock import MagicMock, patch

os.environ['JWT_SECRET_KEY'] = 'test-secret-jwt-key-32-bytes-long-for-hmac-sha256!'
os.environ['VOLCANO_ADMIN_KEY'] = 'test_volcano_admin'
os.environ['ASYNC_DISPATCH_LOCAL'] = 'false' # Do not auto-spawn worker threads during unit test

from app import app, db
from models import User, Company, Idea, Message, PipelineLog
from shared_state import DistributedLogStore
from agents import generate_content_with_retry
from worker import process_signal, fetch_next_queued_idea

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    
    with app.app_context():
        db.create_all()
        
        # Seed test user and company
        user = User(
            username='testalien_worker',
            name='Test Worker Alien',
            email='alien_worker@volcano.io',
            password_hash='scrypt:fakehash',
            is_verified=True
        )
        company = Company(
            company_name='TestCorp Titan',
            email='titan_worker@testcorp.com',
            password_hash='scrypt:fakehash',
            is_verified=True
        )
        db.session.add(user)
        db.session.add(company)
        db.session.commit()
        
        yield app.test_client()
        
        db.session.remove()
        db.drop_all()

def test_work_01_submit_returns_immediately_with_queued_status(client):
    """WORK-01: Verify /api/ideas/submit decouples from synchronous processing and returns queued status"""
    # Generate alien auth token
    from flask_jwt_extended import create_access_token
    with app.app_context():
        user = User.query.filter_by(username='testalien_worker').first()
        token = create_access_token(identity=str(user.id), additional_claims={'role': 'alien', 'username': user.username})

    start_time = time.time()
    res = client.post('/api/ideas/submit', json={
        'title': 'Autonomous Rover Swarm',
        'content': 'Deploying swarm robotics for terrain scouting',
        'signal_type': 'New Feature',
        'recipient_company_id': 1
    }, headers={'Authorization': f'Bearer {token}'})

    elapsed = time.time() - start_time
    assert res.status_code == 201
    assert elapsed < 3.0, f"HTTP handler took {elapsed:.2f}s, expected < 3.0s (decoupled)"

    data = res.get_json()
    assert data['status'] == 'queued'
    assert 'signal_id' in data

    # Verify DB state is strictly 'queued'
    with app.app_context():
        idea = db.session.get(Idea, data['signal_id'])
        assert idea is not None
        assert idea.status == 'queued'

def test_work_01_worker_process_signal_lifecycle(client):
    """WORK-01: Verify worker.py processes queued signal through full pipeline lifecycle"""
    with app.app_context():
        user = User.query.first()
        company = Company.query.first()
        idea = Idea(
            title='Satellite Mesh Network',
            content='Low-latency inter-satellite optical links',
            sender_id=user.id,
            recipient_company_id=company.id,
            status='queued'
        )
        db.session.add(idea)
        db.session.commit()
        idea_id = idea.id

    # Mock the AI pipeline to return approved verdict
    mock_pipeline_result = {
        'valid': True,
        'reason': 'Novel optical routing confirmed',
        'tags': 'Space, Telecomm',
        'log': '[0.1s] Read & Validate\n[0.5s] Novel optical routing confirmed'
    }

    with patch('agents.run_pipeline', return_value=mock_pipeline_result):
        success = process_signal(app, idea_id)
        assert success is True

    # Verify final status in database
    with app.app_context():
        updated_idea = db.session.get(Idea, idea_id)
        assert updated_idea.status == 'sent_to_boardroom'
        assert updated_idea.tags == 'Space, Telecomm'
        assert 'Novel optical routing' in updated_idea.ai_analysis_log

def test_work_01_internal_webhook_endpoint_security_and_execution(client):
    """WORK-01: Verify /api/ideas/<id>/process webhook endpoint requires authentication and triggers worker"""
    with app.app_context():
        user = User.query.first()
        company = Company.query.first()
        idea = Idea(
            title='Quantum Key Telemetry',
            content='Quantum telemetry for satellite encryption',
            sender_id=user.id,
            recipient_company_id=company.id,
            status='queued'
        )
        db.session.add(idea)
        db.session.commit()
        idea_id = idea.id

    # 1. Reject without secret
    unauthorized_res = client.post(f'/api/ideas/{idea_id}/process')
    assert unauthorized_res.status_code == 403

    # 2. Accept with valid secret
    mock_pipeline_result = {
        'valid': False,
        'reason': 'Technology already public domain',
        'tags': 'Quantum',
        'log': '[0.1s] Search & Verify\n[0.3s] Rejected'
    }

    with patch('agents.run_pipeline', return_value=mock_pipeline_result):
        auth_res = client.post(
            f'/api/ideas/{idea_id}/process',
            headers={'X-Volcano-Admin-Key': 'test_volcano_admin'}
        )
        assert auth_res.status_code == 200
        assert auth_res.get_json()['status'] == 'completed'

    with app.app_context():
        updated_idea = db.session.get(Idea, idea_id)
        assert updated_idea.status == 'volcano_rejected'

def test_work_02_distributed_log_store_persistence(client):
    """WORK-02: Verify DistributedLogStore persists active logs to database (PipelineLog)"""
    with app.app_context():
        user = User.query.first()
        company = Company.query.first()
        idea = Idea(
            title='Hydrogen Propellant',
            content='Cryogenic hydrogen fuel tank',
            sender_id=user.id,
            recipient_company_id=company.id,
            status='processing'
        )
        db.session.add(idea)
        db.session.commit()
        idea_id = idea.id

        store = DistributedLogStore()
        store.set_initial(idea_id, current_agent="Read & Validate")
        store.update_step(idea_id, "Compare Database")
        store.append_log(idea_id, "[1.0s] Checking prior patents...")

        # Verify DB record created
        db_log = PipelineLog.query.filter_by(idea_id=idea_id).first()
        assert db_log is not None
        assert db_log.current_agent == "Compare Database"
        assert "[1.0s] Checking prior patents..." in db_log.logs

        # Create a fresh store instance (simulating another Cloud Run instance)
        fresh_store = DistributedLogStore()
        retrieved = fresh_store.get(idea_id)
        assert retrieved is not None
        assert retrieved["current_agent"] == "Compare Database"
        assert "[1.0s] Checking prior patents..." in retrieved["logs"]

        # Clear idea and verify DB cleanup
        fresh_store.clear_idea(idea_id)
        assert PipelineLog.query.filter_by(idea_id=idea_id).first() is None

def test_work_03_gemini_exponential_backoff_and_jitter():
    """WORK-03: Verify generate_content_with_retry backs off and retries on 429 quota exhaustion"""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"valid": true, "reason": "Passed"}'

    # Simulate 2 failures with 429 Resource Exhausted, then success on 3rd attempt
    error_429 = Exception("429 Resource has been exhausted (e.g. check quota).")
    mock_client.models.generate_content.side_effect = [
        error_429,
        error_429,
        mock_response
    ]

    mock_log = MagicMock()
    start_time = time.time()
    
    # Use smaller initial backoff for fast testing
    result = generate_content_with_retry(
        client=mock_client,
        contents="Test Prompt",
        config=None,
        max_retries=4,
        initial_backoff=0.05,
        log=mock_log
    )

    assert result == mock_response
    assert mock_client.models.generate_content.call_count == 3
    assert mock_log.add.call_count >= 2 # Logged retries

def test_work_04_frozen_requirements_validation():
    """WORK-04: Verify requirements.txt pins verified dependencies including langsmith and google-genai"""
    req_path = os.path.join(os.path.dirname(__file__), 'requirements.txt')
    assert os.path.exists(req_path), "requirements.txt must exist"

    with open(req_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    req_dict = {}
    for line in lines:
        if '==' in line:
            pkg, ver = line.split('==', 1)
            req_dict[pkg.lower()] = ver

    # Verify essential packages are pinned
    essential = ['flask', 'flask-jwt-extended', 'google-genai', 'langsmith', 'psycopg2-binary', 'gunicorn']
    for pkg in essential:
        assert pkg in req_dict, f"Essential package '{pkg}' must be in requirements.txt"
        assert len(req_dict[pkg]) > 0, f"Package '{pkg}' must be pinned to a specific version"

def test_work_05_error_sanitization_and_privacy(client):
    """WORK-05: Verify that internal exceptions, Google API JSON payloads, and stack traces are NEVER leaked to users"""
    from worker import sanitize_user_feedback

    # 1. Test unit sanitization mappings
    raw_google_404 = "System Error: 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.0-flash is no longer available.', 'status': 'NOT_FOUND'}}"
    sanitized_404 = sanitize_user_feedback(raw_google_404)
    assert "404" not in sanitized_404
    assert "NOT_FOUND" not in sanitized_404
    assert "{'error'" not in sanitized_404
    assert "Cognitive reasoning cluster is currently refreshing its model weights" in sanitized_404

    raw_429 = "System Error: 429 Resource has been exhausted (quota exceeded)"
    sanitized_429 = sanitize_user_feedback(raw_429)
    assert "429" not in sanitized_429
    assert "throttled" in sanitized_429.lower()

    # Legitimate business reason should pass through
    safe_reason = "Duplicate idea already submitted"
    assert sanitize_user_feedback(safe_reason) == safe_reason

    # 2. Test worker pipeline integration with raw failure
    with app.app_context():
        user = User.query.first()
        company = Company.query.first()
        idea = Idea(
            title='Secret Space Engine',
            content='Antimatter drive proposal',
            sender_id=user.id,
            recipient_company_id=company.id,
            status='queued'
        )
        db.session.add(idea)
        db.session.commit()
        idea_id = idea.id

    mock_error_result = {
        'valid': False,
        'reason': raw_google_404,
        'tags': 'Space',
        'log': '[0.1s] Read & Validate\n[0.2s] Exception in generate_content: 404 NOT_FOUND'
    }

    with patch('agents.run_pipeline', return_value=mock_error_result):
        process_signal(app, idea_id)

    with app.app_context():
        updated_idea = db.session.get(Idea, idea_id)
        assert updated_idea.status == 'volcano_rejected'
        # Admin log must preserve the technical trace
        assert "404 NOT_FOUND" in updated_idea.ai_analysis_log

        # User-facing message must be sanitized
        user_message = Message.query.filter_by(idea_id=idea_id, sender_type='volcano').first()
        assert user_message is not None
        assert "404" not in user_message.content
        assert "{'error'" not in user_message.content
        assert "COGNITIVE CORE STATUS:" in user_message.content

