# Inkloom AI Unified AI Layer (`app/ai/`)

## 1. Overview & Architecture

The `backend/app/ai/` package provides a unified, provider-agnostic, enterprise-grade AI execution layer powering all generative and cognitive capabilities across Inkloom AI, including:
- **Brand Intelligence Assistant**: Grounded guideline Q&A with strict provenance citations.
- **Visual Design Intelligence**: Image critique, color/typography recommendations, and concept generation.
- **Marketing Copy Strategist**: Multi-format campaign copy aligned with approved brand voice and verified claims.
- **Legal & Compliance Intelligence**: Advertising claim evaluation, statutory risk analysis, and disclaimers.
- **Shared Intelligence Engine**: Cross-domain orchestration coordinating workflows across all enterprise roles.

### Key Architectural Principles
1. **Provider-Agnostic Design**: Standardized `AIRequest` and `AIResponse` models decouple application consumers from any specific LLM provider API.
2. **Deterministic Baseline Guarantee**: The system never crashes or returns an unhandled exception if cloud network APIs are slow, rate-limited (HTTP 429), or unavailable (HTTP 5xx). It gracefully falls back to deterministic rule-based engines.
3. **Multi-Tenant Isolation**: No prompts, parameters, or session memory bleed across organizational tenants. AuthContext validation is strictly enforced at all entry boundaries.
4. **Zero-Leakage Security & Privacy**: API keys, credentials, and raw prompts are never emitted in logs, exceptions, or audit traces (even at `DEBUG` log level).

---

## 2. Directory Structure

```
backend/app/ai/
├── __init__.py               # Public exports (get_ai_client, AIClient, AIRequest, AIResponse)
├── schemas.py                # Core domain schemas (AIRequest, AIResponse, AIUsageInfo)
├── client.py                 # AIClient dispatcher, provider selection, JSON validation, retry fallback
├── safety.py                 # Prompt boundary isolation, prompt injection defense, key redaction
├── usage.py                  # In-memory metrics tracking (call counts, latency, tokens, error rates)
├── compat.py                 # Legacy backward-compatibility adapters (GeminiAdapter, OfflineRuleAdapter)
├── providers/
│   ├── base.py               # Abstract BaseAIProvider definition
│   ├── gemini.py             # Google Gemini HTTP REST integration via httpx (x-goog-api-key)
│   └── offline.py            # Local deterministic rule engine with zero network dependencies
└── tasks/
    ├── grounded_answer.py     # Guideline Q&A with passage grounding
    ├── explain_violation.py   # Contextual violation explanation
    ├── rewrite.py             # Tone-aligned safe text rewriting
    ├── campaign_adaptation.py # Multi-format creative copy generation
    └── image_review.py        # Multimodal visual design analysis
```

---

## 3. Core Schemas

### `AIRequest`
Represents an abstract request to the AI layer:
```python
class AIRequest(BaseModel):
    task: str                               # e.g., "grounded_answer", "design_concept", "marketing_copy"
    system: str                             # System instructions and operational boundaries
    user: str                               # Task instruction and contextual metadata
    images: List[Union[str, bytes]] = []    # File paths or raw image bytes for multimodal models
    json_schema: Optional[Type[BaseModel]]  # Expected Pydantic output schema for JSON mode
    max_tokens: int = 1000                  # Maximum tokens to generate
    temperature: float = 0.2                # Sampling temperature
    extra_context: Dict[str, Any] = {}      # Additional metadata passed to offline fallbacks
```

### `AIResponse`
Represents the normalized output:
```python
class AIResponse(BaseModel):
    text: str                               # Primary text response or formatted output
    data: Optional[Any] = None              # Validated Pydantic model instance if json_schema was requested
    mode: str = "llm"                       # "llm" (cloud provider) | "offline" (deterministic rule fallback)
    provider: str = "gemini"                # Provider that generated the response
    model: str = "gemini-3.1-flash-lite"    # Exact model name used
    usage: AIUsageInfo                      # Prompt length, completion length, latency
```

---

## 4. Supported Providers

### 1. Google Gemini (`providers/gemini.py`)
- Direct REST integration via `httpx` without heavy proprietary SDKs.
- Uses `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- Authenticates securely via `x-goog-api-key` HTTP header (never query parameters).
- Supports multimodal vision (base64-encoded `inlineData` parts).
- Enforces strict candidate verification, checking for content filtering, safety blocks, and truncated outputs.
- Retries with exponential backoff on HTTP 429 and transient 5xx server errors.

### 2. Deterministic Offline Engine (`providers/offline.py`)
- Requires zero API keys and zero internet access.
- Executes task-specific deterministic logic (keyword extraction, rule-based rewriting, conservative baseline suggestions).
- Guarantees 100% test reliability and instant local development out of the box.

---

## 5. Security & Prompt Injection Defense

All user inputs, third-party content, and document excerpts are isolated using XML-style delimited containers:
```
<<<UNTRUSTED_CONTENT>>>
[passage_chunk_1] Document: Brand_Guide.pdf (Page 2)
Content: ...
<<<END_UNTRUSTED_CONTENT>>>
```
The system instruction explicitly directs the model to treat all text within `<<<UNTRUSTED_CONTENT>>>` as passive data and to completely ignore any embedded commands or overrides (e.g., `"IGNORE ALL PRIOR INSTRUCTIONS"`).

### Secret Redaction
All API keys are automatically redacted from error strings, logging records, and HTTP headers before persisting or returning to callers:
```python
redact_api_keys(raw_text, api_key) -> "[REDACTED_API_KEY]"
```

---

## 6. How to Add a New Provider (e.g., Anthropic or OpenAI)

Adding a new provider requires only creating a single provider file:

1. Create `backend/app/ai/providers/anthropic.py` inheriting from `BaseAIProvider`:
   ```python
   from app.ai.providers.base import BaseAIProvider
   from app.ai.schemas import AIRequest, AIResponse

   class AnthropicProvider(BaseAIProvider):
       def __init__(self, api_key: str, model_name: str = "claude-3-5-sonnet", timeout: float = 30.0):
           self.api_key = api_key
           self.model_name = model_name
           self.timeout = timeout

       def generate(self, request: AIRequest) -> AIResponse:
           # Call Anthropic Messages API via httpx
           ...
   ```
2. Register the provider in `AIClient._get_provider(provider_name)` inside `backend/app/ai/client.py`:
   ```python
   elif name in ("anthropic", "claude"):
       return AnthropicProvider(api_key=key, model_name=model)
   ```
3. Set `LLM_PROVIDER=anthropic` in `backend/.env`.

---

## 7. Configuration Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | string | `gemini` | Active AI provider (`gemini` or `offline`) |
| `LLM_API_KEY` | string | `""` | Google AI Studio Gemini API key |
| `LLM_MODEL_NAME` | string | `gemini-3.1-flash-lite` | Active model identifier |
| `LLM_TIMEOUT_SECONDS` | float | `30.0` | Maximum network timeout per request |
| `LLM_MAX_RETRIES` | int | `2` | Retry attempts for transient 429/5xx status codes |
| `LLM_MAX_OUTPUT_TOKENS` | int | `1000` | Default maximum output tokens |

