"""
In-memory usage telemetry and execution metrics for Inkloom AI.
Tracks invocation counts, failure rates, latency, and token volume without leaking payload contents.
"""
import threading
from typing import Any, Dict


class AIUsageTracker:
    """Thread-safe in-memory usage tracker."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.requests_total: int = 0
        self.errors_total: int = 0
        self.tokens_prompt_total: int = 0
        self.tokens_completion_total: int = 0
        self.total_latency_ms: float = 0.0

    def record_call(
        self,
        prompt_len: int,
        completion_len: int,
        latency_ms: float,
        success: bool,
    ) -> None:
        """Records telemetry from a provider call."""
        # Standard approximation if token counts not directly reported: 4 characters per token
        prompt_tokens = max(1, prompt_len // 4) if prompt_len > 0 else 0
        completion_tokens = max(1, completion_len // 4) if completion_len > 0 else 0

        with self._lock:
            self.requests_total += 1
            if not success:
                self.errors_total += 1
            self.tokens_prompt_total += prompt_tokens
            self.tokens_completion_total += completion_tokens
            self.total_latency_ms += max(0.0, latency_ms)

    def get_metrics(self) -> Dict[str, Any]:
        """Returns snapshot of usage metrics."""
        with self._lock:
            return {
                "requests_total": self.requests_total,
                "errors_total": self.errors_total,
                "tokens_prompt_total": self.tokens_prompt_total,
                "tokens_completion_total": self.tokens_completion_total,
                "total_latency_ms": round(self.total_latency_ms, 2),
                "avg_latency_ms": (
                    round(self.total_latency_ms / self.requests_total, 2)
                    if self.requests_total > 0
                    else 0.0
                ),
            }

    def reset(self) -> None:
        """Resets all metrics (primarily for test isolation)."""
        with self._lock:
            self.requests_total = 0
            self.errors_total = 0
            self.tokens_prompt_total = 0
            self.tokens_completion_total = 0
            self.total_latency_ms = 0.0


# Global singleton instance
global_ai_usage_tracker = AIUsageTracker()

