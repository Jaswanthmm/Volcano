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
-   Node.js & npm
-   Python 3.10+
-   Google Gemini API Key

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# Create .env file with GEMINI_API_KEY=...
python app.py
```

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

### Access Points
-   **Alien Portal**: `http://localhost:5173/login/alien`
-   **Thinking Engine**: `http://localhost:5173/thinking-engine`
-   **Boardroom**: `http://localhost:5173/login/boardroom`
