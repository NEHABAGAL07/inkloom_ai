"""Contract Tests: Validates JSON Schema, Example File, and Pydantic Model Alignment."""

import json
import os
import pytest
from app.schemas.audit import AuditResultSchema
from app.services.ai_audit.engine import AIAuditEngine

CONTRACTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "contracts")
)
SCHEMA_PATH = os.path.join(CONTRACTS_DIR, "audit-result.schema.json")
EXAMPLE_PATH = os.path.join(CONTRACTS_DIR, "audit-result.example.json")


def test_schema_and_example_files_exist():
    """Verify contracts directory contains schema and example."""
    assert os.path.exists(SCHEMA_PATH), f"Schema not found at {SCHEMA_PATH}"
    assert os.path.exists(EXAMPLE_PATH), f"Example not found at {EXAMPLE_PATH}"


def test_example_validates_against_json_schema():
    """Verify audit-result.example.json strictly satisfies audit-result.schema.json."""
    import jsonschema

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)
    with open(EXAMPLE_PATH, "r", encoding="utf-8") as f:
        example = json.load(f)

    # Will raise jsonschema.ValidationError if invalid
    jsonschema.validate(instance=example, schema=schema)


def test_example_parses_into_pydantic_schema():
    """Verify audit-result.example.json cleanly deserializes into AuditResultSchema."""
    with open(EXAMPLE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    result_model = AuditResultSchema(**data)
    assert result_model.schema_version == "1.0.0"
    assert len(result_model.findings) == 3
    assert result_model.overall_status.value == "warning"

    # Verify no citations are fabricated
    for finding in result_model.findings:
        if finding.category.value == "claim_verification":
            assert finding.source_reference is None


def test_live_engine_output_conforms_to_json_schema():
    """Verify live AIAuditEngine generation conforms to both Pydantic and JSON Schema."""
    import jsonschema

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)

    engine = AIAuditEngine()
    test_text = (
        "Try inkloom today! Our platform provides a 100% error-free guarantee across marketing copy. "
        "We are super pumped to launch."
    )
    audit_res = engine.audit_text(text=test_text, content_id="cnt-live-test-001")

    # Dump to JSON dict
    audit_dict = json.loads(audit_res.model_dump_json())

    # Validate against JSON schema
    jsonschema.validate(instance=audit_dict, schema=schema)
    assert len(audit_res.findings) >= 2
