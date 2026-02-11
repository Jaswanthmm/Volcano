# 🌋 Volcano: The Idea Monetization Ecosystem

**Volcano** is a decentralized marketplace that connects creative individuals ("Aliens") with forward-thinking companies ("Boardrooms"). It allows common people to pitch innovative ideas and bug reports directly to product teams—and **get paid** for them.

The platform solves the core disconnect in open innovation: Companies want great ideas but can't filter through the noise; People have great ideas but no direct line to being heard (or rewarded).

---

## 🎯 Aim of the Project

The primary mission of Volcano is **Democratizing Innovation through Monetization**.

1.  **For Common People (Aliens):**
    *   Give everyone a direct line to top companies.
    *   **Get Paid:** Transform casual thoughts and bug findings into income.

2.  **For Companies (Boardroom):**
    *   Access a global brain-trust of innovation without the noise.
    *   **Pay for Quality:** Only see ideas that have been vetted, researched, and structured.

### 💡 The Core Solution: Why it Works
Companies usually don't have a platform where they can hear from the masses. They ignore public suggestion boxes because 99% of it is spam or low quality via common platforms.
**Volcano** introduces the **Thinking Engine**—an AI-powered middleware that acts as a rigorous quality filter.
*   It ensures that by the time an idea reaches the "Boardroom", it is already vetted, researched for duplicates, and structurally sound.
*   This quality guarantee makes companies willing to **pay per signal** effectively.

---

## ⚙️ How It Runs (Technical Ecosystem)

Volcano operates as a real-time, event-driven platform powered by a multi-agent AI swarm.

### 1. **The Frontend (User Interfaces)**
*   **Alien Portal (React/Vite)**: A gamified, high-frequency submission interface where users "transmit" signals to space.
*   **Thinking Engine Visualization**: A "Screensaver" mode that visualizes the AI swarm analyzing data in real-time only for Volcano company Admins.(Node-Link Graphs).
*   **Boardroom Dashboard**: A professional, sterile analytics suite for companies to view active ideas from the common techies and users.

### 2. **The Intelligence Layer (Backend)**
*   **Framework**: Flask (Python) serving RESTful APIs.
*   **The Swarm**: A background orchestration of Google Gemini 2.0 agents.
    *   *They don't just "chat"; they perform work.* (Searching Google, checking databases, estimating financial impact).
*   **Async Core**: User submissions are non-blocking. The "Thinking" happens in parallel background threads to ensure the UI remains instantly responsive.

### 3. **Data & Security**
*   **Storage**: SQLAlchemy (SQLite for dev) storing strictly structured signal data.
*   **Authentication**: Role-based access control (Aliens vs. Boardroom Executives).

---

## 🤖 The Agent Pipeline (The "Swarm")

When a signal is submitted, it flows through a specific pipeline based on its type:

### **Pipeline A: New Feature / Strategy**
1.  **Gatekeeper 🛡️**: Checks for spam, coherence, and quality. Rejects noise immediately.
2.  **Detective 🕵️‍♂️**: Searches the web (Google) to see if the feature already exists or is planned by the company. Rejects duplicates.
3.  **Historian 📚**: Checks the internal database for duplicate submissions from other users.
4.  **Visionary 🚀**: Analyzes strategic value, potential impact, and assigns tags (e.g., "High Impact", "Viral").

### **Pipeline B: Bug Report**
1.  **QA Engineer 🐛**: Validates the bug report for clarity (Steps to Reproduce) and searches for known issues online.
2.  **Historian 📚**: Checks internal database for duplicate bug reports.
3.  **Engineering Manager 👷**: Triages the bug, assigning **Priority** (P0-P3) and **Severity**.

---

## 👥 User Roles & Workflows

### 1. **The Alien (User)**
-   **Action**: Submits ideas or bugs via the Alien Dashboard.
-   **Feedback**: Sees real-time status updates ("Sent to Volcano", "Rejected", "Sent to Boardroom").
-   **Interaction**: Can chat with the Boardroom if the idea is approved.

### 2. **The Thinking Engine (AI System)**
-   **Action**: Automatically processes every submission.
-   **Visualization**: A dedicated "Screen Saver" style page that shows the AI analyzing ideas in real-time (0---0---0 Nodes).

### 3. **The Boardroom (Company Admins)**
-   **Action**: Views only the *High Quality* signals that passed the AI.
-   **Power**: Can Accept/Reject/Archive signals.
-   **Communication**: Can reply to the Alien directly from the dashboard.

---

## 🚀 Setup & Installation

### Prerequisites
-   **Node.js & npm** (v16 or higher)
-   **Python 3.10+**
-   **PostgreSQL** (v14 or higher) - Running locally on port `5432`
-   **Google Gemini API Key** - Get it from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: PostgreSQL Database Setup

#### 1.1 Install PostgreSQL (Windows)
If you haven't installed PostgreSQL yet:
```powershell
winget install PostgreSQL.PostgreSQL.16
```

During installation, you'll be prompted to set a password for the `postgres` user. Remember this password!

#### 1.2 Create Database
After installation, create the Volcano database:
```powershell
cd backend
python create_db.py
```

This will create a database named `volcano_db` with user `postgres`.

#### 1.3 Configure Environment Variables
Create a `.env` file in the `backend` directory with the following:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/volcano_db
```

Replace:
- `YOUR_PASSWORD` with your PostgreSQL password (set during installation)
- `your_gemini_api_key_here` with your actual Gemini API key

#### 1.4 Initialize Database Schema
The database tables will be created automatically on first run. To manually initialize:
```powershell
python backend/app.py
```
Press `Ctrl+C` after you see "Running on http://..." to stop it.

#### 1.5 Seed Company Data (Optional)
To populate the database with sample companies for testing:
```powershell
cd backend
python seed_companies.py
```

This creates companies like Google, Meta, Amazon, etc. that Aliens can submit ideas to.

#### 1.6 Migrating from SQLite (If Applicable)
If you have an existing `ideas.db` SQLite database and want to migrate:

**Step 1: Export SQLite data to JSON**
```powershell
cd backend
python export_sqlite.py
```

**Step 2: Import JSON data to PostgreSQL**
```powershell
python import_postgres.py
```

**Step 3: Fix Auto-Increment Sequences**
After importing data, reset the sequences:
```powershell
python fix_sequences.py
```

This ensures new records don't conflict with imported IDs.

#### 1.7 Verify Database Setup
Check that your database is properly configured:
```powershell
python backend/view_data.py
```

This will show you the current row counts and let you browse tables.

---

### Step 2: Backend Setup

#### 2.1 Install Python Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

**Note:** You can optionally use a virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### 2.2 Initialize Database Schema
The database schema will be created automatically when you first run the application.

---

### Step 3: Frontend Setup

```powershell
cd frontend
npm install
npm run build
```

This builds the production-ready frontend into the `dist` folder, which will be served by the backend.

---

### Step 4: Start the Application

#### Option A: Using the Production Launcher (Recommended)
From the project root directory:
```powershell
.\start_production.bat
```

This script will:
1. ✅ Check environment variables
2. ✅ Install dependencies
3. ✅ Build the frontend
4. ✅ Launch the **API Server** (port 8080)
5. ✅ Launch the **Thinking Engine Worker**
6. ✅ Open your browser to `http://localhost:8080`

#### Option B: Manual Start (For Development/Debugging)
If the batch script fails, you can start services manually:

**Terminal 1 - API Server:**
```powershell
python backend\production.py
```

**Terminal 2 - AI Worker:**
```powershell
python backend\worker.py
```

Then open your browser to: `http://localhost:8080`

---

### Step 5: Access the Application

Once running, you can access:

| Interface | URL | Description |
|-----------|-----|-------------|
| **Landing Page** | `http://localhost:8080` | Main entry point |
| **Alien Dashboard** | `http://localhost:8080/alien` | Submit ideas/bugs |
| **Boardroom Dashboard** | `http://localhost:8080/boardroom` | Review signals (Companies) |
| **Thinking Engine** | `http://localhost:8080/thinking-engine` | AI visualization (Admin) |
| **API Docs** | `http://localhost:8080/api/` | Backend API endpoints |

---

### Troubleshooting

#### Issue: "Database connection failed"
**Solution:**
1. Verify PostgreSQL is running: `psql -U postgres -d volcano_db`
2. Check your `DATABASE_URL` in `backend/.env`
3. Ensure the password is correct

#### Issue: "GEMINI_API_KEY not found"
**Solution:**
Add your API key to `backend/.env`:
```env
GEMINI_API_KEY=your_actual_key_here
```

#### Issue: "Port 8080 already in use"
**Solution:**
Kill existing Python processes:
```powershell
taskkill /IM python.exe /F
```
Then restart the application.

#### Issue: "Frontend not loading / 404 errors"
**Solution:**
Rebuild the frontend:
```powershell
cd frontend
npm run build
```

---

### Viewing Database Data

To inspect the database contents:

**Option 1: CLI Tool**
```powershell
python backend\view_data.py
```

**Option 2: PostgreSQL Shell**
```powershell
psql -U postgres -d volcano_db
```

**Option 3: GUI Tool**
Use **pgAdmin 4** or **DBeaver** with these credentials:
- Host: `localhost`
- Port: `5432`
- Database: `volcano_db`
- User: `postgres`
- Password: `dbpostgres`

---

### Service Ports
-   **Web Server (Frontend + API)**: Port `8080`
-   **PostgreSQL Database**: Port `5432`
-   **Volcano Thinking Engine**: Background Worker Process (No Port)
