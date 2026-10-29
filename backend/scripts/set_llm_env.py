#!/usr/bin/env python3
"""
set_llm_env.py
Interactive script to safely configure Gemini API credentials in backend/.env.
Never prints, logs, or returns the API key.
"""
import os
import sys
import getpass
import shutil
from pathlib import Path


def main():
    # 1. Determine paths
    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent
    repo_root = backend_dir.parent

    # Check that repo's .gitignore ignores .env
    gitignore_path = repo_root / ".gitignore"
    if not gitignore_path.exists():
        print("ERROR: Root .gitignore file not found. Refusing to proceed.", file=sys.stderr)
        sys.exit(1)

    try:
        with open(gitignore_path, "r", encoding="utf-8") as f:
            gitignore_content = f.read()
    except Exception as exc:
        print(f"ERROR: Unable to read .gitignore: {exc}", file=sys.stderr)
        sys.exit(1)

    # Verify that .env is ignored
    lines = [line.strip() for line in gitignore_content.splitlines()]
    if ".env" not in lines and not any(line.startswith(".env") for line in lines):
        print("WARNING: '.env' is not listed in root .gitignore! Halting to protect secrets.", file=sys.stderr)
        sys.exit(1)

    # 2. Prompt for Gemini API Key (hidden)
    try:
        api_key = getpass.getpass("Enter Gemini API Key (hidden): ").strip()
    except Exception:
        api_key = sys.stdin.readline().strip()
    if not api_key:
        print("ERROR: API key cannot be empty.", file=sys.stderr)
        sys.exit(1)
    if any(c in api_key for c in (" ", "\t", "\n", "'", '"')):
        print("ERROR: API key must not contain spaces or quotation marks.", file=sys.stderr)
        sys.exit(1)

    # 3. Prompt for model name
    print("Tip: Copy the current Flash model name from Google AI Studio (e.g. gemini-1.5-flash or gemini-2.0-flash).")
    model_name = input("Enter Gemini model name: ").strip()
    if not model_name:
        print("ERROR: Model name cannot be empty.", file=sys.stderr)
        sys.exit(1)
    if any(c in model_name for c in (" ", "\t", "\n", "'", '"')):
        print("ERROR: Model name must not contain spaces or quotation marks.", file=sys.stderr)
        sys.exit(1)

    env_path = backend_dir / ".env"

    # 4. Backup existing .env to ~/inkloom_env_backup outside the repo
    if env_path.exists():
        backup_path = Path.home() / "inkloom_env_backup"
        try:
            shutil.copy2(env_path, backup_path)
        except Exception as exc:
            print(f"ERROR: Failed to back up existing .env to {backup_path}: {exc}", file=sys.stderr)
            sys.exit(1)

    # 5. Read existing .env lines preserving order and comments
    old_lines = []
    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                old_lines = f.readlines()
        except Exception as exc:
            print(f"ERROR: Could not read existing .env: {exc}", file=sys.stderr)
            sys.exit(1)

    # Prepare keys to update
    keys_to_set = {
        "LLM_PROVIDER": "gemini",
        "LLM_API_KEY": api_key,
        "LLM_MODEL_NAME": model_name,
    }
    seen_keys = set()
    new_lines = []

    for line in old_lines:
        stripped = line.strip()
        matched_key = None
        for k in keys_to_set:
            if stripped.startswith(f"{k}=") or stripped.startswith(f"export {k}="):
                matched_key = k
                break

        if matched_key:
            new_lines.append(f"{matched_key}={keys_to_set[matched_key]}\n")
            seen_keys.add(matched_key)
        else:
            new_lines.append(line)

    # Append any keys not found in existing .env
    for k, val in keys_to_set.items():
        if k not in seen_keys:
            if new_lines and not new_lines[-1].endswith("\n"):
                new_lines.append("\n")
            new_lines.append(f"{k}={val}\n")

    # 6. Write updated lines to backend/.env safely
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as exc:
        print(f"ERROR: Failed to write to {env_path}: {exc}", file=sys.stderr)
        sys.exit(1)

    # Print only required confirmation - never print the key
    print(f"updated, key length: {len(api_key)}")


if __name__ == "__main__":
    main()
