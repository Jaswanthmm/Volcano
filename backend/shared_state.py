# Shared in-memory store for real-time agent logs
# Structure: { idea_id: { "agents": ["Gatekeeper", "Detective"], "current_agent": "Detective", "logs": ["Scan started...", "Searching..."] } }
# In-memory shared state for real-time tracking (e.g. active analysis logs).
ACTIVE_LOGS = {}
