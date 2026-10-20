# Automated Test Suite for Volcano Phase 1: Security & Authentication (SEC-01 to SEC-05)
import pytest
import os
import json

# Ensure test database and secrets are configured
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'test-secret-jwt-key-32-bytes-long-for-hmac-sha256!'
os.environ['VOLCANO_ADMIN_KEY'] = 'test_volcano_admin'
os.environ['ALLOWED_ORIGINS'] = 'http://localhost:5173,http://localhost:3000'

from app import app, db
from models import User, Company, Idea

@pytest.fixture(scope='module')
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_sec_01_alien_auth_and_jwt(client):
    """SEC-01: Alien Registration, Login, and JWT Token Generation"""
    # 1. Register Alien
    reg_res = client.post('/api/auth/alien/register', json={
        "email": "alien_test@void.net",
        "password": "Password123!",
        "name": "Zorgon",
        "phone": "+1234567890"
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.get_json()
    assert "alien_id" in reg_data
    alien_id = reg_data["alien_id"]

    # 2. Login Alien
    login_res = client.post('/api/auth/alien/login', json={
        "identifier": alien_id,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    assert "user_info" in login_data
    assert login_data["user_info"]["role"] == "alien"
    assert login_data["user_info"]["alien_id"] == alien_id

    # 3. Test Token Refresh
    refresh_token = login_data["refresh_token"]
    refresh_res = client.post('/api/auth/refresh', headers={
        "Authorization": f"Bearer {refresh_token}"
    })
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.get_json()

    # 4. Test /api/auth/me
    access_token = login_data["access_token"]
    me_res = client.get('/api/auth/me', headers={
        "Authorization": f"Bearer {access_token}"
    })
    assert me_res.status_code == 200
    assert me_res.get_json()["alien_id"] == alien_id

def test_sec_01_boardroom_auth_and_jwt(client):
    """SEC-01: Boardroom Registration, Login, and JWT Token Generation"""
    # 1. Register Company
    reg_res = client.post('/api/auth/boardroom/register', json={
        "company_name": "Stripe Corp",
        "email": "exec@stripe.com",
        "password": "CorporatePassword456!",
        "website_url": "https://stripe.com",
        "phone": "+1987654321"
    })
    assert reg_res.status_code == 201

    # 2. Login Company
    login_res = client.post('/api/auth/boardroom/login', json={
        "email": "exec@stripe.com",
        "password": "CorporatePassword456!"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    assert "user_info" in login_data
    assert login_data["user_info"]["role"] == "titan"
    assert login_data["user_info"]["company_name"] == "Stripe Corp"

def test_sec_02_signal_endpoints_security(client):
    """SEC-02: Enforce JWT and Role-Based Access on Signal Endpoints"""
    # 1. Submit Signal without Auth -> 401
    unauth_res = client.post('/api/ideas/submit', json={
        "title": "Unauthenticated Signal",
        "content": "This should fail",
        "company_name": "Stripe Corp"
    })
    assert unauth_res.status_code == 401

    # Login Alien and Company to get tokens
    alien_login = client.post('/api/auth/alien/login', json={
        "identifier": "alien_test@void.net",
        "password": "Password123!"
    }).get_json()
    alien_token = alien_login["access_token"]

    boardroom_login = client.post('/api/auth/boardroom/login', json={
        "email": "exec@stripe.com",
        "password": "CorporatePassword456!"
    }).get_json()
    boardroom_token = boardroom_login["access_token"]
    company_id = boardroom_login["user_info"]["id"]

    # 2. Boardroom cannot submit signals (Role requirement: Alien only) -> 403
    titan_submit_res = client.post('/api/ideas/submit', json={
        "title": "Titan submitting signal",
        "content": "Should not be permitted",
        "company_name": "Stripe Corp"
    }, headers={"Authorization": f"Bearer {boardroom_token}"})
    assert titan_submit_res.status_code == 403

    # 3. Alien submits signal successfully -> 201
    submit_res = client.post('/api/ideas/submit', json={
        "title": "Autonomous AI Agent Swarm",
        "content": "A breakthrough multi-agent pipeline for enterprise signals",
        "company_name": "Stripe Corp",
        "signal_type": "New Feature"
    }, headers={"Authorization": f"Bearer {alien_token}"})
    assert submit_res.status_code == 201
    signal_id = submit_res.get_json()["signal_id"]

    # 4. Alien queries their signals -> 200
    my_ideas_res = client.get('/api/ideas/my', headers={"Authorization": f"Bearer {alien_token}"})
    assert my_ideas_res.status_code == 200
    my_ideas = my_ideas_res.get_json()
    assert len(my_ideas) >= 1
    assert any(i["id"] == signal_id for i in my_ideas)

    # 5. Unauthorized status update by Alien -> 403
    alien_status_res = client.post(f'/api/ideas/{signal_id}/status', json={
        "status": "accepted"
    }, headers={"Authorization": f"Bearer {alien_token}"})
    assert alien_status_res.status_code == 403

    # 6. Status update by another company (unauthorized) -> 403
    # Register and login Company B
    client.post('/api/auth/boardroom/register', json={
        "company_name": "Acme Ventures",
        "email": "leader@acme.org",
        "password": "AcmePassword789!",
        "website_url": "https://acme.org"
    })
    comp_b_login = client.post('/api/auth/boardroom/login', json={
        "email": "leader@acme.org",
        "password": "AcmePassword789!"
    }).get_json()
    comp_b_token = comp_b_login["access_token"]

    comp_b_status_res = client.post(f'/api/ideas/{signal_id}/status', json={
        "status": "accepted"
    }, headers={"Authorization": f"Bearer {comp_b_token}"})
    assert comp_b_status_res.status_code == 403

    # 7. Authorized status update by the intended Boardroom -> 200
    intended_status_res = client.post(f'/api/ideas/{signal_id}/status', json={
        "status": "interesting"
    }, headers={"Authorization": f"Bearer {boardroom_token}"})
    assert intended_status_res.status_code == 200
    assert intended_status_res.get_json()["new_status"] == "interesting"

def test_sec_03_thinking_engine_admin_security(client):
    """SEC-03: Thinking Engine Admin Login & Protected Volcano Endpoints"""
    # 1. Unauthenticated access to /stream -> 401
    unauth_stream = client.get('/api/volcano/stream')
    assert unauth_stream.status_code == 401

    # 2. Unauthenticated access to /stats -> 401
    unauth_stats = client.get('/api/volcano/stats')
    assert unauth_stats.status_code == 401

    # 3. Alien or Titan token accessing /stream -> 403
    alien_token = client.post('/api/auth/alien/login', json={
        "identifier": "alien_test@void.net",
        "password": "Password123!"
    }).get_json()["access_token"]
    assert client.get('/api/volcano/stream', headers={"Authorization": f"Bearer {alien_token}"}).status_code == 403
    assert client.get('/api/volcano/stats', headers={"Authorization": f"Bearer {alien_token}"}).status_code == 403

    # 4. Invalid Admin Key -> 401
    bad_admin = client.post('/api/auth/admin/login', json={"password": "wrong_password"})
    assert bad_admin.status_code == 401

    # 5. Valid Admin Key -> 200 & JWT
    good_admin = client.post('/api/auth/admin/login', json={"password": "test_volcano_admin"})
    assert good_admin.status_code == 200
    admin_token = good_admin.get_json()["access_token"]

    # 6. Admin token accessing /stream & /stats -> 200
    admin_stream = client.get('/api/volcano/stream', headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_stream.status_code == 200
    assert isinstance(admin_stream.get_json(), list)

    admin_stats = client.get('/api/volcano/stats', headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_stats.status_code == 200
    stats = admin_stats.get_json()
    assert "total" in stats
    assert "approved" in stats

def test_sec_04_cors_configuration(client):
    """SEC-04: Restricted CORS Headers"""
    res = client.get('/', headers={"Origin": "http://localhost:5173"})
    assert res.status_code == 200
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"
    assert res.headers.get("Access-Control-Allow-Credentials") == "true"
