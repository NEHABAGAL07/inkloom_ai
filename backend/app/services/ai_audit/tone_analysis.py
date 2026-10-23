"""Inkloom AI - Tone and Voice Analysis Module (Backward Compatible Wrapper)."""

from app.services.ai_audit.brand_voice import BrandVoiceAnalyzer

# ToneAnalyzer is alias to BrandVoiceAnalyzer
ToneAnalyzer = BrandVoiceAnalyzer

__all__ = ["ToneAnalyzer", "BrandVoiceAnalyzer"]
