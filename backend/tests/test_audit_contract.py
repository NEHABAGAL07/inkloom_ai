import os
import json
import pytest
from jsonschema import validate, Draft202012Validator
from app.schemas.audit_contract import AuditResult


@pytest.fixture
def contract_files():
    # Root of the repo is 2 levels up from backend/tests/
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    schema_path = os.path.join(repo_root, "contracts", "audit-result.schema.json")
    example_path = os.path.join(repo_root, "contracts", "audit-result.example.json")
    
    assert os.path.exists(schema_path), f"Schema not found at {schema_path}"
    assert os.path.exists(example_path), f"Example not found at {example_path}"

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    with open(example_path, "r", encoding="utf-8") as f:
        example = json.load(f)

    return schema, example


def test_example_conforms_to_json_schema(contract_files):
    schema, example = contract_files
    # Validate against JSON Schema Draft 2020-12
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(example), key=lambda e: e.path)
    assert len(errors) == 0, f"JSON Schema validation errors: {[e.message for e in errors]}"


def test_example_parses_into_pydantic_model(contract_files):
    _, example = contract_files
    parsed = AuditResult.model_validate(example)
    assert parsed.schema_version == "1.0.0"
    assert parsed.summary.compliance_score == 74.5
    assert len(parsed.findings) == 4
    assert parsed.findings[0].category.value == "terminology"
    assert parsed.findings[1].category.value == "claim_verification"
    assert parsed.findings[1].source_reference.verification_status.value == "unverified"
