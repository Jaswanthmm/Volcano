# 🌋 Volcano — Production Deployment Runbook (Google Cloud Platform)

This guide provides the complete, step-by-step procedure to deploy Volcano (Flask Backend + Multi-Agent Reasoning Engine + Vite/React Frontend + Supabase PostgreSQL) to a fresh Google Cloud Platform (GCP) project.

---

## 📋 Architecture Overview

- **Compute Platform:** Google Cloud Run (Fully managed, serverless, containerized)
- **Container Registry:** Google Artifact Registry (`docker` format)
- **Build Engine:** Google Cloud Build (Builds containers remotely in the cloud — no local Docker required)
- **Secrets Management:** Google Secret Manager (Runtime injection for DB, JWT, and Gemini credentials)
- **Database:** Supabase PostgreSQL 17 (Session Pooler via `aws-1-ap-northeast-2.pooler.supabase.com:5432`)
- **Reasoning Pipeline:** Multi-Agent Gemini pipeline running in Cloud Run (`--no-cpu-throttling`)

---

## 🛠️ Phase 0: Prerequisites & Initial Setup

You can run these commands directly from **[Google Cloud Shell](https://shell.cloud.google.com)** (recommended — pre-authenticated with `gcloud` installed) or your local terminal with `gcloud` CLI.

### 1. Set your GCP Project ID
Replace `<YOUR_PROJECT_ID>` with your new GCP project ID:
```bash
export PROJECT_ID="<YOUR_PROJECT_ID>"
export REGION="asia-northeast3" # Seoul (lowest latency to Supabase ap-northeast-2) or "us-central1"
export REPO_NAME="volcano-repo"

# Set active project
gcloud config set project $PROJECT_ID
```

### 2. Enable Required Google Cloud APIs
```bash
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com
```

### 3. Create Artifact Registry Docker Repository
```bash
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Volcano production containers"
```

---

## 🔐 Phase 1: Provision Production Secrets in Secret Manager

Store all sensitive environment variables securely in Secret Manager.

```bash
# 1. Supabase PostgreSQL Session Pooler Connection String
echo -n "postgresql://postgres.qmniopmybnzfoldnxtet:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" | \
    gcloud secrets create volcano-database-url --data-file=-

# 2. Google Gemini API Key
echo -n "<YOUR_GEMINI_API_KEY>" | \
    gcloud secrets create volcano-gemini-api-key --data-file=-

# 3. High-entropy JWT Secret Key (generate 64 hex chars)
echo -n "$(openssl rand -hex 32)" | \
    gcloud secrets create volcano-jwt-secret --data-file=-

# 4. Volcano Thinking Engine Admin Access Key
echo -n "<YOUR_ADMIN_SECRET_KEY>" | \
    gcloud secrets create volcano-admin-key --data-file=-
```

### Grant Secret Access to Cloud Run Service Account
```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant secretAccessor role
for SECRET in volcano-database-url volcano-gemini-api-key volcano-jwt-secret volcano-admin-key; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:${CLOUD_RUN_SA}" \
        --role="roles/secretmanager.secretAccessor"
done
```

---

## ⚙️ Phase 2: Deploy Backend to Cloud Run

### 1. Build and Push Backend Image via Cloud Build
Run from the root of the Volcano project:
```bash
gcloud builds submit \
    --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest \
    ./backend
```

### 2. Deploy Backend Container to Cloud Run
> **Important:** `--no-cpu-throttling` is specified so that the asynchronous multi-agent background worker thread continues analyzing signals after HTTP 201 response.

```bash
gcloud run deploy volcano-backend \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=10 \
    --no-cpu-throttling \
    --set-secrets="DATABASE_URL=volcano-database-url:latest,GEMINI_API_KEY=volcano-gemini-api-key:latest,JWT_SECRET_KEY=volcano-jwt-secret:latest,VOLCANO_ADMIN_KEY=volcano-admin-key:latest" \
    --set-env-vars="ASYNC_DISPATCH_LOCAL=true,JWT_ACCESS_EXPIRES_HOURS=24,JWT_REFRESH_EXPIRES_DAYS=30"
```

### 3. Verify Backend Health
Retrieve the assigned service URL:
```bash
BACKEND_URL=$(gcloud run services describe volcano-backend --region=$REGION --format='value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

# Test deep health check
curl -f "${BACKEND_URL}/healthz"
```
Expected output:
```json
{"status":"healthy","service":"Volcano Backend API","database":{"status":"connected","dialect":"postgresql","metrics":{...}}}
```

---

## 🎨 Phase 3: Deploy Frontend to Cloud Run

### 1. Build Frontend Image Injecting Backend URL
Vite compiles `VITE_API_URL` into the production static bundle at build time:

```bash
gcloud builds submit \
    --substitutions=_API_URL="${BACKEND_URL}" \
    --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest \
    ./frontend
```

### 2. Deploy Frontend Container to Cloud Run
```bash
gcloud run deploy volcano-frontend \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=5
```

### 3. Retrieve Frontend Production URL
```bash
FRONTEND_URL=$(gcloud run services describe volcano-frontend --region=$REGION --format='value(status.url)')
echo "Volcano is live at: $FRONTEND_URL"
```

---

## 🔄 Phase 4: Configure CORS & Wire Production Origins

The backend automatically accepts requests from all `https://*.run.app` origins by default regex. If you connect a custom domain (e.g., `https://volcano.ai`), update the backend environment variable:

```bash
gcloud run services update volcano-backend \
    --region=$REGION \
    --update-env-vars="ALLOWED_ORIGINS=${FRONTEND_URL},https://localhost:5173"
```

---

## 🧪 Phase 5: Production Verification Checklist

1. **Uptime & Health:**
   - [ ] Visit `${BACKEND_URL}/healthz` — Status returns `healthy` with Supabase PostgreSQL dialect.
   - [ ] Visit `${FRONTEND_URL}` in browser — Hero landing page loads with modern glassmorphism UI.

2. **Alien Workflow:**
   - [ ] Navigate to `/alien/login` and register a new Alien profile.
   - [ ] Submit an idea / signal targeting a company (e.g. OpenAI / NVIDIA).
   - [ ] Confirm instantaneous submission response (`queued` status).

3. **Multi-Agent Pipeline & Distributed Logs:**
   - [ ] Navigate to `/thinking-engine` using the `VOLCANO_ADMIN_KEY`.
   - [ ] Observe real-time logs streaming from Supabase `pipeline_log` table.
   - [ ] Confirm all 4 agents execute (Deconstruct -> Value Potential -> Tags -> Boardroom Summary).

4. **Titan Boardroom Workflow:**
   - [ ] Log in as a Titan Boardroom member at `/boardroom/login`.
   - [ ] Review the analyzed signal with generated tags and potential value.
   - [ ] Accept/reject signal and initiate encrypted messaging with Alien.
