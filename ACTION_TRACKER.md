# 🌋 Volcano — Production Readiness Action Tracker

This tracker monitors all tasks required to transition Volcano from demonstration to an enterprise-grade, secure, and production-ready system on Google Cloud Platform.

---

## 📊 Progress Summary

| Phase | Category | Total Tasks | Completed | In Progress | Pending | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Phase 1 | Security & Authentication (P0) | 5 | 5 | 0 | 0 | 🟢 Completed |
| **Phase 2** | AI Pipeline & Asynchronous Workers (P0) | 5 | 5 | 0 | 0 | 🟢 Completed |
| **Phase 3** | Database & Infrastructure Hardening (P1) | 4 | 4 | 0 | 0 | 🟢 Completed |
| **Phase 4** | Frontend Optimization & Protected Routes (P1) | 4 | 4 | 0 | 0 | 🟢 Completed |
| **Phase 5** | Observability, Testing & CI/CD (P2) | 4 | 1 | 0 | 3 | ⏸️ Paused |
| **PROD** | **GCP Cloud Run Production Deployment** | 5 | 5 | 0 | 0 | 🟢 Completed |
| **TOTAL** | | **27** | **24** | **0** | **3** | **🎉 Live in Production** |

---

## 🔒 Phase 1: Security & Authentication (Priority: P0 - Critical)

> **Objective:** Eliminate plaintext tokens, hardcoded admin credentials, and insecure endpoints. Enforce cryptographic token authentication (JWT) and role-based access control.

- [x] **`SEC-01`**: **Add `flask-jwt-extended` & JWT Token Generation**
  - **Component:** `backend/auth.py`, `backend/requirements.txt`
  - **Details:** Issue signed access and refresh tokens upon valid Alien (`/api/auth/alien/login`) and Boardroom (`/api/auth/boardroom/login`) authentication.
  - **Acceptance Criteria:** Successful logins return `{ access_token, refresh_token, user_info }` instead of simulated status objects.

- [x] **`SEC-02`**: **Enforce JWT & Role-Based Access on Signal Endpoints**
  - **Component:** `backend/ideas.py`
  - **Details:** Add `@jwt_required()` on `/api/ideas/submit`, `/api/ideas/my`, and `/api/ideas/<id>/status`. Extract the identity strictly from JWT context (disallow client-spoofed `sender_identifier`).
  - **Acceptance Criteria:** Unauthenticated or unauthorized callers receive HTTP 401/403. Only the intended company can change signal status.

- [x] **`SEC-03`**: **Secure the Thinking Engine & Remove Client Hardcoded Admin Key**
  - **Component:** `frontend/src/pages/ThinkingEngineLogin.jsx`, `backend/volcano.py`, `backend/auth.py`
  - **Details:** Remove plaintext `password === 'volcano_admin'` check in the client bundle. Create a backend `/api/auth/admin/login` endpoint verifying against a secure server environment variable. Require admin JWT for `/api/volcano/*` endpoints.
  - **Acceptance Criteria:** Public visitors cannot access `/api/volcano/stream` or `/api/volcano/stats` without admin credentials.

- [x] **`SEC-04`**: **Restrict CORS to Authorized Origins**
  - **Component:** `backend/app.py`
  - **Details:** Replace `origins: "*"` with environment-driven allowed origins (e.g. `ALLOWED_ORIGINS=https://volcanolanding-*.run.app,https://volcano.domain.com`).
  - **Acceptance Criteria:** Arbitrary third-party sites cannot initiate authenticated cross-origin requests.

- [x] **`SEC-05`**: **Secret Hygiene & Cloud Secret Manager Migration**
  - **Component:** `backend/.env`, GCP Cloud Run Configuration
  - **Details:** Remove production database passwords and API keys from local `.env` and git history. Migrate secrets to GCP Secret Manager / Cloud Run injected environment variables.
  - **Acceptance Criteria:** No plaintext credentials committed; `.env.example` provided for local setup.

---

## 🤖 Phase 2: Asynchronous AI Pipeline & Worker Reliability (Priority: P0 - Critical)

> **Objective:** Decouple long-running Gemini agent reasoning from web request lifecycle to prevent timeouts, thread drops, and memory fragmentation on Cloud Run.

- [x] **`WORK-01`**: **Decouple HTTP Handler from In-Process Background Thread**
  - **Component:** `backend/ideas.py`, `backend/worker.py`
  - **Details:** Remove `threading.Thread(target=background_worker)` from `/api/ideas/submit`. Replace with a dedicated queue worker (Cloud Tasks webhook trigger or continuous Cloud Run worker service polling `status = 'queued'`).
  - **Acceptance Criteria:** HTTP response returns immediately (<300ms) with `queued` status, while worker independently and reliably executes the AI pipeline.

- [x] **`WORK-02`**: **Replace In-Memory `ACTIVE_LOGS` with Persistent / Shared Store**
  - **Component:** `backend/shared_state.py`, `backend/models.py`, `backend/volcano.py`
  - **Details:** Replace process-local `ACTIVE_LOGS = {}` dictionary with database log storage (or Redis/Supabase Realtime) so multi-worker Gunicorn and Cloud Run instances can stream logs.
  - **Acceptance Criteria:** Real-time log streaming works reliably across distributed backend instances.

- [x] **`WORK-03`**: **Gemini Rate Limiting & 429 Exponential Backoff**
  - **Component:** `backend/agents.py`
  - **Details:** Wrap `generate_content` and Google Search tool calls with exponential backoff and jitter for `429 Resource Exhausted` and quota errors.
  - **Acceptance Criteria:** Surges in signal submissions gracefully queue and retry rather than failing with unhandled exceptions.

- [x] **`WORK-04`**: **Missing Dependencies & Frozen Requirements**
  - **Component:** `backend/requirements.txt`
  - **Details:** Add missing `langsmith` package and pin all backend dependencies to specific verified versions.
  - **Acceptance Criteria:** Clean `pip install -r requirements.txt` succeeds and runs in fresh Docker container without module errors.

- [x] **`WORK-05`**: **User-Facing Error Sanitization & Gemini 3.8 Upgrade**
  - **Component:** `backend/worker.py`, `backend/agents.py`, `backend/test_phase2_worker.py`
  - **Details:** Upgrade default model to `gemini-3.8-flash`. Implement `sanitize_user_feedback()` to prevent leaking internal stack traces, HTTP status codes, or provider JSON payloads to end users in chat inboxes. Persist full technical logs strictly in `ai_analysis_log` for admin audit.
  - **Acceptance Criteria:** End users receive clean, professional status updates; internal technical diagnostics remain accessible only to admins in Thinking Engine logs.

---

## 🗄️ Phase 3: Database & Infrastructure Hardening (Priority: P1 - High)

> **Objective:** Ensure zero data loss, schema evolution support, and resilient connection handling under load.

- [x] **`DB-01`**: **Implement Flask-Migrate & Alembic**
  - **Component:** `backend/app.py`, `backend/migrations/`
  - **Details:** Replace direct `db.create_all()` with Alembic migrations to support safe schema migrations in production.
  - **Acceptance Criteria:** Database schema upgrades and rollbacks can be executed via `flask db upgrade`.

- [x] **`DB-02`**: **Add Strategic Database Indexes**
  - **Component:** `backend/models.py`
  - **Details:** Add indexes for high-frequency queries:
    - `(Idea.recipient_company_id, Idea.status)`
    - `(Idea.sender_id, Idea.created_at)`
    - `(User.username, User.email)`
  - **Acceptance Criteria:** Index execution plans confirmed via `EXPLAIN ANALYZE` on Postgres.

- [x] **`DB-03`**: **Postgres Connection Pooling Configuration**
  - **Component:** `backend/app.py`
  - **Details:** Configure SQLAlchemy engine pooling parameters (`pool_size`, `max_overflow`, `pool_recycle`, `pool_pre_ping`) to prevent Supabase connection exhaustion.
  - **Acceptance Criteria:** App survives burst load without "too many clients" database errors.

- [x] **`DB-04`**: **Container Optimization & Multi-Stage Dockerfiles**
  - **Component:** `backend/Dockerfile`, `frontend/Dockerfile`
  - **Details:** Ensure minimal image footprint, non-root user execution, and fast layer caching.
  - **Acceptance Criteria:** Containers build cleanly and pass vulnerability scanning.

---

## 💻 Phase 4: Frontend Optimization & Protected Routes (Priority: P1 - High)

> **Objective:** Connect the frontend to dynamic environment variables, secure routing, and eliminate client-side token mocks.

- [x] **`FE-01`**: **Dynamic Environment API URL**
  - **Component:** `frontend/src/config.js`
  - **Details:** Replace hardcoded `http://localhost:8001` with `import.meta.env.VITE_API_URL || "http://localhost:8001"`.
  - **Acceptance Criteria:** Production builds use the Cloud Run backend URL without manual code changes.

- [x] **`FE-02`**: **True JWT Storage & Authentication Interceptors**
  - **Component:** `frontend/src/pages/AlienLogin.jsx`, `frontend/src/pages/BoardroomLogin.jsx`
  - **Details:** Store genuine JWT access tokens and set `Authorization: Bearer <token>` on all API requests.
  - **Acceptance Criteria:** Removing or tampering with the token triggers automatic redirection to login.

- [x] **`FE-03`**: **Robust `<ProtectedRoute>` Wrapper**
  - **Component:** `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/App.jsx`
  - **Details:** Implement role-aware route guards (`allowedRoles: ['alien']`, `allowedRoles: ['titan']`, `allowedRoles: ['admin']`).
  - **Acceptance Criteria:** Unauthorized users attempting direct URL navigation are bounced to appropriate login screens with redirect state.

- [x] **`FE-04`**: **Dead Code & Asset Cleanup**
  - **Component:** `frontend/src/firebase.js`, `backend/firebase_config.py`
  - **Details:** Clean up unused Firebase SDK imports and dead code assets.
  - **Acceptance Criteria:** Bundle size reduced and zero unused library imports in build output.

---

## 🚀 Phase 5: Observability, Testing & CI/CD (Priority: P2 - Medium) [PAUSED]

> **Status:** Paused per user instruction to prioritize immediate production deployment to Google Cloud Platform. Will resume post-production launch.

- [x] **`OPS-01`**: **Deep Health Check Endpoint (`/healthz`)**
  - **Component:** `backend/app.py`
  - **Details:** Expose `/healthz` verifying database read/write and Gemini API readiness for Cloud Run liveness probes.
  - **Acceptance Criteria:** Returns 200 OK when operational, 503 Service Unavailable when DB is down.

- [ ] **`OPS-02`**: **Error Tracking & Structured Logging (Paused)**
  - **Component:** `backend/app.py`, `frontend/src/components/ErrorBoundary.jsx`
  - **Details:** Integrate Sentry or Google Cloud Logging/Error Reporting.
  - **Acceptance Criteria:** Unhandled backend exceptions and frontend crash boundaries automatically create alerts.

- [ ] **`OPS-03`**: **Automated Test Suite (Pytest & Vitest) (Paused)**
  - **Component:** `backend/tests/`, `frontend/src/__tests__/`
  - **Details:** Add unit tests for AI agent response parsing, auth flows, and signal state transitions.
  - **Acceptance Criteria:** Tests run with `pytest` and `npm test` with >80% coverage on core logic.

- [ ] **`OPS-04`**: **CI/CD Pipeline (GitHub Actions) (Paused)**
  - **Component:** `.github/workflows/deploy.yml`
  - **Details:** Automated workflow that runs linting, tests, builds Docker containers, and deploys to Google Cloud Run on commit to `main`.
  - **Acceptance Criteria:** Fully automated zero-downtime deployment on git push. 

---

## 🌐 Production Deployment Action Items (Google Cloud Platform)

> **Objective:** Deploy Volcano Backend and Frontend to Google Cloud Run in the user's new GCP project with Secret Manager integration and live Supabase PostgreSQL. See [DEPLOYMENT.md](file:///d:/Valcano/DEPLOYMENT.md) for full runbook.

- [x] **`PROD-01`**: **GCP Project Initialization & API Activation**
  - **Target:** New GCP Project ID (`PROJECT_ID`), Region: `europe-north2`.
  - **Action:** Authenticate in Google Cloud Shell / CLI, set project, enable `run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`, `secretmanager.googleapis.com`, and create Docker repo `volcano-repo`.

- [x] **`PROD-02`**: **Provision Production Secrets in Secret Manager**
  - **Target:** Google Cloud Secret Manager.
  - **Action:** Store `volcano-database-url` (Supabase pooler URI), `volcano-gemini-api-key`, `volcano-jwt-secret`, and `volcano-admin-key`. Grant Secret Accessor role to Cloud Run compute service account.

- [x] **`PROD-03`**: **Build & Deploy Volcano Backend to Cloud Run**
  - **Target:** Cloud Run Service `volcano-backend` ([https://volcano-backend-75852057188.europe-north2.run.app](https://volcano-backend-75852057188.europe-north2.run.app)).
  - **Action:** Deployed container with `--no-cpu-throttling`, 1Gi RAM, port 8080, and bound secrets. Verified `GET /api/health` returns `200 OK` with active Supabase PostgreSQL connection.

- [x] **`PROD-04`**: **Build & Deploy Volcano Frontend to Cloud Run**
  - **Target:** Cloud Run Service `volcano-frontend` ([https://volcano-frontend-75852057188.europe-north2.run.app](https://volcano-frontend-75852057188.europe-north2.run.app)).
  - **Action:** Deployed hardened Nginx container on port 8080 with production API URL configured. Verified `GET /` returns `200 OK`.

- [x] **`PROD-05`**: **Production Smoke Test & Verification**
  - **Target:** End-to-End System.
  - **Action:** Successfully registered production Alien user, verified JWT authentication, verified live Supabase database read/write metrics, and verified CORS communication between frontend and backend.
