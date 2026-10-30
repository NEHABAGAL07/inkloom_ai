"""
Unit Tests for Gemini LLM Adapter & Fallback Mechanics (Phase 1)
Uses httpx.MockTransport ONLY — Zero external network dependencies.
Tests:
1. Success path: Generates grounded answer with valid citations
2. JSON wrapped in markdown ``` fences is cleanly parsed
3. HTTP 500 server error triggers FallbackAdapter to OfflineRuleAdapter
4. Network timeout triggers FallbackAdapter to OfflineRuleAdapter
5. HTTP 429 rate limit triggers FallbackAdapter to OfflineRuleAdapter
6. Empty or blocked candidates triggers FallbackAdapter
7. Malformed JSON output triggers FallbackAdapter
8. Missing API key returns OfflineRuleAdapter directly
9. Security & Privacy: API key never appears in logs or exceptions
"""
import json
import logging
import httpx
import pytest

from app.ai.compat import (
    GeminiAdapter,
    OfflineRuleAdapter,
    FallbackAdapter,
    LLMAdapterError,
    get_llm_adapter,
)


def test_gemini_adapter_success_path():
    """Verify GeminiAdapter completes with x-goog-api-key header and parses grounded answer."""
    captured_headers = {}

    def mock_handler(request: httpx.Request):
        nonlocal captured_headers
        captured_headers = dict(request.headers)
        response_body = {
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "answer": "The white knockout logo must always be used on dark blue backgrounds.",
                                    "used_passage_ids": ["chk_1"],
                                })
                            }
                        ]
                    },
                }
            ]
        }
        return httpx.Response(200, json=response_body)

    transport = httpx.MockTransport(mock_handler)
    client = httpx.Client(transport=transport)
    adapter = GeminiAdapter(api_key="test_secret_key_123", model_name="gemini-1.5-flash", client=client)

    passages = [
        {
            "chunk_id": "chk_1",
            "document_name": "Brand_Book.pdf",
            "page": 4,
            "text": "The white knockout logo must always be used on dark blue backgrounds.",
            "score": 0.8,
        }
    ]

    result = adapter.generate_grounded_answer(
        question="Can I use a white logo on dark blue?",
        passages=passages,
    )

    assert captured_headers.get("x-goog-api-key") == "test_secret_key_123"
    assert "white knockout logo" in result["answer"]
    assert result["used_passage_ids"] == ["chk_1"]
    assert result["confidence"] == "high"


def test_gemini_adapter_json_in_markdown_fences():
    """Verify that JSON wrapped in markdown ```json ... ``` code fences is parsed cleanly."""
    def mock_handler(request: httpx.Request):
        fenced_content = "```json\n" + json.dumps({
            "answer": "Primary typeface is Inter Bold.",
            "used_passage_ids": ["chk_font"],
        }) + "\n```"
        response_body = {
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {
                        "parts": [{"text": fenced_content}]
                    },
                }
            ]
        }
        return httpx.Response(200, json=response_body)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = GeminiAdapter(api_key="test_key", client=client)

    passages = [
        {
            "chunk_id": "chk_font",
            "document_name": "Typography.pdf",
            "page": 2,
            "text": "Primary typeface is Inter Bold.",
            "score": 0.6,
        }
    ]

    result = adapter.generate_grounded_answer("What is our font?", passages=passages)
    assert result["answer"] == "Primary typeface is Inter Bold."
    assert result["used_passage_ids"] == ["chk_font"]


def test_fallback_on_http_500():
    """Verify HTTP 500 error from primary LLM transparently delegates to OfflineRuleAdapter."""
    def mock_handler(request: httpx.Request):
        return httpx.Response(500, json={"error": "Internal Google Server Error"})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    primary = GeminiAdapter(api_key="test_key", client=client)
    fallback = OfflineRuleAdapter()
    adapter = FallbackAdapter(primary=primary, fallback=fallback)

    passages = [
        {
            "chunk_id": "chk_1",
            "document_name": "Brand_Book.pdf",
            "page": 4,
            "snippet": "Use reversed white mark on dark blue.",
            "text": "Use reversed white mark on dark blue.",
            "score": 0.5,
        }
    ]

    result = adapter.generate_grounded_answer("Logo rules", passages=passages)
    # Extractive answer from OfflineRuleAdapter
    assert "Here are the most relevant sections from your documents" in result["answer"]
    assert result["mode"] == "extractive"
    assert result["used_passage_ids"] == ["chk_1"]


def test_fallback_on_network_timeout():
    """Verify network timeout triggers FallbackAdapter without raising 500."""
    def mock_handler(request: httpx.Request):
        raise httpx.ReadTimeout("Read timed out after 20s")

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    primary = GeminiAdapter(api_key="test_key", client=client)
    fallback = OfflineRuleAdapter()
    adapter = FallbackAdapter(primary=primary, fallback=fallback)

    passages = [
        {
            "chunk_id": "chk_1",
            "document_name": "Brand_Book.pdf",
            "page": 2,
            "snippet": "Primary color is Teal #0D9488.",
            "text": "Primary color is Teal #0D9488.",
            "score": 0.4,
        }
    ]

    result = adapter.generate_grounded_answer("What is our color?", passages=passages)
    assert "Here are the most relevant sections from your documents" in result["answer"]
    assert result["mode"] == "extractive"


def test_fallback_on_429_quota_exceeded():
    """Verify HTTP 429 quota exhaustion gracefully falls back to extractive answer."""
    def mock_handler(request: httpx.Request):
        return httpx.Response(429, json={"error": {"code": 429, "message": "Resource exhausted"}})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    primary = GeminiAdapter(api_key="test_key", client=client)
    fallback = OfflineRuleAdapter()
    adapter = FallbackAdapter(primary=primary, fallback=fallback)

    passages = [
        {
            "chunk_id": "chk_1",
            "document_name": "Brand_Book.pdf",
            "page": 1,
            "snippet": "Corporate identity specifications.",
            "text": "Corporate identity specifications.",
            "score": 0.3,
        }
    ]

    result = adapter.generate_grounded_answer("Identity specs", passages=passages)
    assert "Here are the most relevant sections from your documents" in result["answer"]
    assert result["mode"] == "extractive"


def test_fallback_on_empty_or_safety_blocked_candidates():
    """Verify safety block or empty candidates trigger fallback."""
    def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={"candidates": [], "promptFeedback": {"blockReason": "SAFETY"}})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    primary = GeminiAdapter(api_key="test_key", client=client)
    fallback = OfflineRuleAdapter()
    adapter = FallbackAdapter(primary=primary, fallback=fallback)

    passages = [
        {
            "chunk_id": "chk_1",
            "document_name": "Brand_Book.pdf",
            "page": 1,
            "snippet": "Rules text.",
            "text": "Rules text.",
            "score": 0.3,
        }
    ]

    result = adapter.generate_grounded_answer("Brand question", passages=passages)
    assert "Here are the most relevant sections from your documents" in result["answer"]
    assert result["mode"] == "extractive"


def test_fallback_on_malformed_json_response():
    """Verify malformed JSON payload from Gemini triggers fallback to extractive answer."""
    def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {
                        "parts": [{"text": "This is plain text instead of the requested JSON object."}]
                    },
                }
            ]
        })

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    primary = GeminiAdapter(api_key="test_key", client=client)
    fallback = OfflineRuleAdapter()
    adapter = FallbackAdapter(primary=primary, fallback=fallback)

    passages = [
        {
            "chunk_id": "chk_1",
            "document_name": "Brand_Book.pdf",
            "page": 1,
            "snippet": "Rules text.",
            "text": "Rules text.",
            "score": 0.3,
        }
    ]

    result = adapter.generate_grounded_answer("Brand question", passages=passages)
    assert "Here are the most relevant sections from your documents" in result["answer"]
    assert result["mode"] == "extractive"


def test_no_key_returns_offline_adapter():
    """When no API key is provided or configured, get_llm_adapter returns OfflineRuleAdapter directly."""
    adapter = get_llm_adapter(provider="gemini", api_key="")
    assert isinstance(adapter, OfflineRuleAdapter)
    assert not isinstance(adapter, FallbackAdapter)


def test_api_key_never_leaked_in_logs_or_exceptions(caplog):
    """Verify API key never appears in log messages or exception strings."""
    secret_key = "AIzaSySECRET_MOCK_KEY_DO_NOT_LEAK_9999"

    def mock_handler(request: httpx.Request):
        return httpx.Response(500, json={"error": "Something went wrong"})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    gemini = GeminiAdapter(api_key=secret_key, client=client)

    with caplog.at_level(logging.DEBUG):
        # 1. Direct call raises LLMAdapterError without secret in message
        with pytest.raises(LLMAdapterError) as exc_info:
            gemini.complete(system="sys", user="user")
        assert secret_key not in str(exc_info.value)

        # 2. Fallback call logs warning without secret in logs
        fallback_adapter = FallbackAdapter(primary=gemini, fallback=OfflineRuleAdapter())
        fallback_adapter.complete(system="sys", user="user")

        assert secret_key not in caplog.text


def test_finish_reason_max_tokens_raises_and_triggers_fallback():
    """Verify that finishReason MAX_TOKENS raises an error and triggers FallbackAdapter."""
    def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={
            "candidates": [
                {
                    "finishReason": "MAX_TOKENS",
                    "content": {
                        "parts": [{"text": '{"answer": "Truncated json due to token limit'}]
                    },
                }
            ]
        })

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    gemini = GeminiAdapter(api_key="test_key", client=client)

    # 1. Direct call must raise LLMAdapterError on finishReason MAX_TOKENS
    with pytest.raises(LLMAdapterError) as exc_info:
        gemini.complete(system="sys", user="user")
    assert "MAX_TOKENS" in str(exc_info.value)

    # 2. Wrapped in FallbackAdapter, it must catch the error and return offline extractive answer
    fallback_adapter = FallbackAdapter(primary=gemini, fallback=OfflineRuleAdapter())
    passages = [
        {
            "chunk_id": "chk_token",
            "document_name": "Brand_Book.pdf",
            "page": 3,
            "snippet": "Maximum clear space guidelines.",
            "text": "Maximum clear space guidelines.",
            "score": 0.45,
        }
    ]
    result = fallback_adapter.generate_grounded_answer("What are clear space rules?", passages=passages)
    assert "Here are the most relevant sections from your documents" in result["answer"]
    assert result["mode"] == "extractive"
    assert result["used_passage_ids"] == ["chk_token"]


def test_httpx_and_httpcore_debug_caplog_never_contains_api_key(caplog):
    """Verify caplog at DEBUG level for 'httpx' and 'httpcore' loggers never contains the API key."""
    secret_key = "AIzaSySECRET_HTTPCORE_DEBUG_KEY_8888"

    def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={
            "candidates": [
                {
                    "finishReason": "STOP",
                    "content": {
                        "parts": [{"text": "Sample answer."}]
                    },
                }
            ]
        })

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    gemini = GeminiAdapter(api_key=secret_key, client=client)

    # Enable DEBUG level on httpx, httpcore, and root logger
    caplog.set_level(logging.DEBUG, logger="httpx")
    caplog.set_level(logging.DEBUG, logger="httpcore")
    caplog.set_level(logging.DEBUG)

    gemini.complete(system="System instructions", user="User inquiry")

    # Assert the secret key never leaked into httpx/httpcore or general log records
    assert secret_key not in caplog.text
    for record in caplog.records:
        assert secret_key not in record.getMessage()

