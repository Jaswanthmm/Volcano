# Shared in-memory store for real-time agent logs
# Structure: { idea_id: { "agents": ["Gatekeeper", "Detective"], "current_agent": "Detective", "logs": ["Scan started...", "Searching..."] } }
ACTIVE_LOGS = {}
