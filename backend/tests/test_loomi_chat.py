"""
Unit tests for Loomi AI Chatbot endpoint and context-aware prompt construction.
"""
import pytest
from app.schemas.loomi import (
    LoomiChatRequest,
    LoomiChatMessage,
    LoomiContext,
    LoomiBrandTokens,
)
from app.api.routes.loomi import loomi_chat, _build_loomi_prompt, _generate_fallback_response


def test_build_loomi_prompt():
    req = LoomiChatRequest(
        messages=[
            LoomiChatMessage(role="user", content="Hello, please critique this banner."),
            LoomiChatMessage(role="assistant", content="Certainly! Here is my analysis."),
            LoomiChatMessage(role="user", content="Can you adjust typography tracking?"),
        ],
        context=LoomiContext(
            workspace="Acme Cloud Systems",
            activeAsset="summer-campaign-banner.png",
            concept="Enterprise High-Contrast Modern",
            channel="linkedin (1.91:1)",
            brandTokens=LoomiBrandTokens(
                primaryWordmark="Acme Cloud",
                colors=["#0F172A", "#6366F1", "#10B981", "#FFFFFF"],
                typography=["Outfit", "Inter"],
            ),
        ),
    )

    prompt = _build_loomi_prompt(req)
    assert "Acme Cloud Systems" in prompt
    assert "summer-campaign-banner.png" in prompt
    assert "Enterprise High-Contrast Modern" in prompt
    assert "linkedin (1.91:1)" in prompt
    assert "#0F172A" in prompt
    assert "Outfit, Inter" in prompt
    assert "Can you adjust typography tracking?" in prompt
    assert "Hello, please critique this banner." in prompt


def test_generate_fallback_response():
    ctx = LoomiContext(
        workspace="Acme Brand",
        activeAsset="hero.png",
        concept="Minimalist",
        channel="instagram (1:1)",
        brandTokens=LoomiBrandTokens(
            primaryWordmark="Acme Brand",
            colors=["#111111", "#00FFCC"],
            typography=["Helvetica"],
        ),
    )
    fallback = _generate_fallback_response("Check contrast", ctx)
    assert "Loomi Creative Guidance" in fallback
    assert "WCAG 2.1 AA" in fallback
    assert "#111111" in fallback
    assert "Acme Brand" in fallback


def test_loomi_chat_execution():
    req = LoomiChatRequest(
        messages=[
            LoomiChatMessage(role="user", content="Provide creative direction for an upcoming product launch.")
        ],
        context=LoomiContext(
            workspace="Acme Cloud Systems",
            activeAsset="product-launch.png",
            concept="Enterprise High-Contrast Modern",
            channel="linkedin (1.91:1)",
        ),
    )

    response = loomi_chat(req)
    assert response.id.startswith("loomi_")
    assert response.role == "assistant"
    assert len(response.content) > 50
    assert response.timestamp is not None

