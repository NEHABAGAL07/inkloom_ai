"""
Inkloom AI Root Backend Server Launcher
Can be executed directly from repository root:
    python run_backend.py
"""
import sys
import os
from pathlib import Path

# Resolve backend directory
repo_root = Path(__file__).resolve().parent
backend_dir = repo_root / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Change working directory to backend so relative paths (.env, uploads, db) align cleanly
os.chdir(str(backend_dir))

import uvicorn


def main():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    reload = os.environ.get("RELOAD", "true").lower() in ("1", "true", "yes")

    print(f"Starting Inkloom AI Backend from project root on http://{host}:{port} (reload={reload})...")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    main()

