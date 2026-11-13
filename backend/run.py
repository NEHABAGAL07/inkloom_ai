"""
Inkloom AI Backend Launcher
Usage:
    python run.py
    python backend/run.py
"""
import sys
import os
from pathlib import Path

# Ensure backend directory is in sys.path and set as current working directory
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.chdir(str(backend_dir))

import uvicorn


def main():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    reload = os.environ.get("RELOAD", "true").lower() in ("1", "true", "yes")

    print(f"Starting Inkloom AI API on http://{host}:{port} (reload={reload})...")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    main()

