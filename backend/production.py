from waitress import serve
from app import app
import os
from flask import send_from_directory

# Serve Frontend Static Files
# Assuming 'dist' is in '../frontend/dist' relative to backend
frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(frontend_dist_path, path)):
        return send_from_directory(frontend_dist_path, path)
    else:
        return send_from_directory(frontend_dist_path, 'index.html')

if __name__ == "__main__":
    print(f"✅ Starting Production Server at http://0.0.0.0:8080")
    print(f"📦 Serving Frontend from: {frontend_dist_path}")
    print(f"🚀 API ready at /api/...")
    serve(app, host='0.0.0.0', port=8080)
