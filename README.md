# 🌋 Volcano: The Idea Monetization Ecosystem

**Volcano** is a decentralized marketplace that connects creative individuals ("Aliens") with forward-thinking companies ("Boardrooms"). It allows common people to pitch innovative ideas and bug reports directly to product teams—and **get paid** for them.

The platform solves the core disconnect in open innovation: Companies want great ideas but can't filter through the noise; People have great ideas but no direct line to being heard (or rewarded).

---

## 🚀 Live Deployment (Google Cloud Run)

The system is currently live and auto-scaling on Google Cloud Run:

| Interface | URL | Description |
|-----------|-----|-------------|
| **Volcano Landing** | [https://volcanolanding-44481511017.europe-west4.run.app](https://volcanolanding-44481511017.europe-west4.run.app)(Free trai exhasuted) | **Public Entry Point** |
| **Alien Portal** | [Access via Landing] | Submit signals, view profile, track income |
| **Boardroom** | [Access via Landing] | Corporate dashboard for filtering and acquiring signals |
| **Thinking Engine** | [Only for Admins] | Real-time AI processing visualization |
| **Backend API** | [Only for Admins] | To Validate the Backend Flow

---

## 🎯 Core Mission

**Democratizing Innovation through Monetization.**

1.  **For Common People (Aliens):**
    *   **Direct Access:** Pitch directly to companies like Google, Meta, Amazon.
    *   **Monetization:** Get paid for high-quality ideas and bug reports.
    *   **Gamified Career:** Build your "Alien Profile", earn reputation, and level up.

2.  **For Companies (Boardroom):**
    *   **Noise Filtration:** The "Thinking Engine" (AI) blocks 99% of spam/low-quality submissions.
    *   **Structured Data:** Receive standardized, researched memos instead of random emails.
    *   **Talent Scouting:** Discover high-potential users ("Aliens") based on their signal history.

---

## ⚙️ Cloud Architecture & Tech Stack

Volcano operates as a scalable, event-driven platform hosted on **Google Cloud Platform (GCP)**.

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React (Vite) + Tailwind | Responsive SPA served via Nginx container. |
| **Backend API** | Flask + Gunicorn | Decoupled REST API for handling requests. |
| **AI Worker** | Python + Multithreading | Dedicated background process for heavy AI agents. |
| **Database** | PostgreSQL (Supabase) | Reliability-focused relational database. |
| **AI Models** | Google Gemini 2.0 Flash | The "Brain" powering the agent swarm. |
| **Hosting** | Google Cloud Run | Serverless container orchestration. |
| **CI/CD** | Cloud Build | Automatic deployment on Git push. |

---

## 🤖 The Thinking Engine (AI Pipeline)

When a signal is submitted, it flows through a rigorous AI analysis pipeline:

1.  **Submission**: Alien transmits a signal (Idea).
2.  **Queue**: Signal enters the processing queue (`status: processing`).
3.  **Swarm Analysis**:
    *   **Gatekeeper 🛡️**: Filters spam and nonsense.
    *   **Detective 🕵️‍♂️**: Searches the web (Google) to see if the feature already exists.
    *   **Historian 📚**: Checks internal database for redundancy.
    *   **Visionary 🚀**: Analyzes strategic value and assigns "Interest Score".
4.  **Boardroom Delivery**:
    *   If **Approved**: It appears on the Company's Boardroom Dashboard (`status: interesting`).
    *   If **Rejected**: The Alien receives a specific reason (e.g., "Duplicate of 2024 feature").

---

## 👥 User Workflows

### 👽 The Alien (User)
1.  **Sign Up**: Create an anonymous "Alien ID".
2.  **Transmit**: Select a target company (e.g., Tesla) and submit an idea.
3.  **Track**: Watch the "Signal Stream" on your profile.
4.  **Earn**: If a company "Acquires" your signal, negotiate payment (simulated).

### 👔 The Boardroom (Company)
1.  **Dashboard**: View a filtered feed of high-quality signals.
2.  **Review**: See AI-generated memos (Summary, Impact, Feasibility).
3.  **Action**:
    *   **Mark Interesting**: Shortlist for further review.
    *   **Acquire**: Initiate contact with the Alien.
    *   **Discard**: Remove from feed.
4.  **Scout**: Browse top-performing Aliens in the "Aliens in Town" directory.

---

## 🚀 Development Setup

### Prerequisites
-   Node.js (v16+)
-   Python 3.10+
-   PostgreSQL
-   Google Gemini API Key

### Quick Start (Local)

**1. Clone & Setup Backend**
```bash
cd backend
pip install -r requirements.txt
# Create .env file with DATABASE_URL and GEMINI_API_KEY
python app.py
```

**2. Setup Backend Worker (Terminal 2)**
```bash
cd backend
python worker.py
```

**3. Setup Frontend (Terminal 3)**
```bash
cd frontend
npm install
npm run dev
```

---

*Built for the Future of Work.*
