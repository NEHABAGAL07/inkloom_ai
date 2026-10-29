#!/usr/bin/env python3
"""
check_llm.py
Verifies LLM configuration and tests connectivity without exposing secrets.
"""
import os
import sys
import re
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.ai_audit.llm_adapter import get_llm_adapter, FallbackAdapter, OfflineRuleAdapter


def redact_secrets(text: str, secret: str = "") -> str:
    """Redacts known secret and standard API key patterns from text."""
    if secret:
        text = text.replace(secret, "[REDACTED]")
    # Redact standard Gemini API key patterns
    text = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED]", text)
    return text


def main():
    provider = settings.LLM_PROVIDER
    raw_key = settings.LLM_API_KEY or ""
    key_is_set = bool(raw_key.strip())
    key_length = len(raw_key.strip())
    model_name = settings.LLM_MODEL_NAME

    adapter = get_llm_adapter()
    adapter_class = adapter.__class__.__name__

    print(f"LLM_PROVIDER: {provider}")
    print(f"Key Set: {key_is_set} (length: {key_length})")
    print(f"LLM_MODEL_NAME: {model_name}")
    print(f"Adapter Class: {adapter_class}")

    if isinstance(adapter, FallbackAdapter):
        print(f"  -> Primary: {adapter.primary.__class__.__name__}")
        print(f"  -> Fallback: {adapter.fallback.__class__.__name__}")

    if not key_is_set:
        print("\nNote: LLM_API_KEY is not configured. Running in deterministic offline mode.")
        return

    # Send one short test prompt directly to the primary LLM adapter to verify connectivity
    target = getattr(adapter, "primary", adapter)
    print("\nSending test prompt to LLM adapter...")

    try:
        response = target.complete(
            system="You are an AI brand governance assistant.",
            user="Ping. Respond with 'PONG'.",
            max_tokens=20,
        )
        safe_preview = redact_secrets(response[:150].strip(), raw_key)
        print(f"Result: SUCCESS")
        print(f"Response: {safe_preview!r}")
    except Exception as exc:
        exc_type = type(exc).__name__
        raw_msg = str(exc)
        safe_msg = redact_secrets(raw_msg, raw_key)[:200]

        # Extract HTTP status code if present
        status_code = getattr(exc, "status_code", None)
        if not status_code:
            match = re.search(r"\b(400|401|403|404|429|500|502|503|504)\b", raw_msg)
            if match:
                status_code = int(match.group(1))
            else:
                status_code = "unknown"

        print(f"Result: FAILED")
        print(f"Exception Type: {exc_type}")
        print(f"HTTP Status: {status_code}")
        print(f"Message: {safe_msg}")

        # Status hints
        if status_code in (400, 404):
            print("Hint: 400/404 = wrong model name")
        elif status_code in (401, 403):
            print("Hint: 401/403 = bad key")
        elif status_code == 429:
            print("Hint: 429 = quota exhausted")
        else:
            print(f"Hint: Received status {status_code}")


if __name__ == "__main__":
    main()

