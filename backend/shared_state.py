# Distributed and persistent log store for real-time AI Thinking Engine visualization (WORK-02)
# Bridges in-memory performance with database persistence across multi-worker Cloud Run instances.

import json
from datetime import datetime
from threading import Lock

class DistributedLogStore:
    """
    Thread-safe and database-backed distributed store for active AI pipeline tracking.
    Enables distributed Cloud Run and Gunicorn workers to share live agent logs.
    """
    DEFAULT_AGENTS = ["Read & Validate", "Compare Database", "Search & Verify", "Final Verdict"]

    def __init__(self):
        self._local_cache = {}
        self._lock = Lock()

    def set_initial(self, idea_id, current_agent="Read & Validate", agents=None):
        """Initializes the active log state for an idea in both DB and local cache."""
        if not idea_id:
            return

        agents_list = agents or self.DEFAULT_AGENTS
        payload = {
            "agents": agents_list,
            "current_agent": current_agent,
            "logs": []
        }

        with self._lock:
            self._local_cache[idea_id] = payload

        # Persist to database if in an app context
        self._persist_to_db(idea_id, current_agent, [])

    def update_step(self, idea_id, step_name):
        """Updates the active agent step in local cache and DB."""
        if not idea_id:
            return

        with self._lock:
            if idea_id in self._local_cache:
                self._local_cache[idea_id]["current_agent"] = step_name

        self._persist_step_to_db(idea_id, step_name)

    def append_log(self, idea_id, entry):
        """Appends a new log entry to local cache and DB."""
        if not idea_id:
            return

        with self._lock:
            if idea_id in self._local_cache:
                self._local_cache[idea_id]["logs"].append(entry)
                logs_copy = list(self._local_cache[idea_id]["logs"])
            else:
                logs_copy = [entry]

        self._persist_logs_to_db(idea_id, logs_copy)

    def get(self, idea_id, default=None):
        """Retrieves active log from local cache or database."""
        if not idea_id:
            return default

        with self._lock:
            if idea_id in self._local_cache:
                return self._local_cache[idea_id]

        # Attempt to read from database
        db_state = self._read_from_db(idea_id)
        if db_state:
            with self._lock:
                self._local_cache[idea_id] = db_state
            return db_state

        return default

    def clear_idea(self, idea_id):
        """Cleans up active log state upon pipeline completion."""
        if not idea_id:
            return

        with self._lock:
            self._local_cache.pop(idea_id, None)

        self._delete_from_db(idea_id)

    # --- Dictionary Protocol Compatibility ---
    def __contains__(self, idea_id):
        return self.get(idea_id) is not None

    def __getitem__(self, idea_id):
        val = self.get(idea_id)
        if val is None:
            raise KeyError(idea_id)
        return val

    def __setitem__(self, idea_id, value):
        with self._lock:
            self._local_cache[idea_id] = value
        current_agent = value.get("current_agent", "Read & Validate")
        logs = value.get("logs", [])
        self._persist_to_db(idea_id, current_agent, logs)

    def __delitem__(self, idea_id):
        self.clear_idea(idea_id)

    # --- Internal Database Helpers ---
    def _get_db_session(self):
        try:
            from models import db
            return db.session
        except Exception:
            return None

    def _persist_to_db(self, idea_id, current_agent, logs):
        try:
            from models import db, PipelineLog
            entry = PipelineLog.query.filter_by(idea_id=idea_id).first()
            if not entry:
                entry = PipelineLog(
                    idea_id=idea_id,
                    current_agent=current_agent,
                    logs=json.dumps(logs)
                )
                db.session.add(entry)
            else:
                entry.current_agent = current_agent
                entry.logs = json.dumps(logs)
                entry.updated_at = datetime.utcnow()
            db.session.commit()
        except Exception:
            try:
                from models import db
                db.session.rollback()
            except Exception:
                pass

    def _persist_step_to_db(self, idea_id, step_name):
        try:
            from models import db, PipelineLog
            entry = PipelineLog.query.filter_by(idea_id=idea_id).first()
            if entry:
                entry.current_agent = step_name
                entry.updated_at = datetime.utcnow()
                db.session.commit()
            else:
                self._persist_to_db(idea_id, step_name, [])
        except Exception:
            try:
                from models import db
                db.session.rollback()
            except Exception:
                pass

    def _persist_logs_to_db(self, idea_id, logs):
        try:
            from models import db, PipelineLog
            entry = PipelineLog.query.filter_by(idea_id=idea_id).first()
            if entry:
                entry.logs = json.dumps(logs)
                entry.updated_at = datetime.utcnow()
                db.session.commit()
            else:
                self._persist_to_db(idea_id, "Read & Validate", logs)
        except Exception:
            try:
                from models import db
                db.session.rollback()
            except Exception:
                pass

    def _read_from_db(self, idea_id):
        try:
            from models import PipelineLog
            entry = PipelineLog.query.filter_by(idea_id=idea_id).first()
            if entry:
                try:
                    parsed_logs = json.loads(entry.logs) if entry.logs else []
                except Exception:
                    parsed_logs = [entry.logs] if entry.logs else []

                return {
                    "agents": self.DEFAULT_AGENTS,
                    "current_agent": entry.current_agent or "Read & Validate",
                    "logs": parsed_logs
                }
        except Exception:
            pass
        return None

    def _delete_from_db(self, idea_id):
        try:
            from models import db, PipelineLog
            entry = PipelineLog.query.filter_by(idea_id=idea_id).first()
            if entry:
                db.session.delete(entry)
                db.session.commit()
        except Exception:
            try:
                from models import db
                db.session.rollback()
            except Exception:
                pass

# Global singleton instance for transparent backward compatibility
ACTIVE_LOGS = DistributedLogStore()
