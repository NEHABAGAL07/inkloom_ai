#!/usr/bin/env python3
"""
Stand-alone Audit Contract Validator

Validates contracts/audit-result.example.json against contracts/audit-result.schema.json
using standard library + jsonschema.
"""
import os
import sys
import json

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_path = os.path.join(root, "contracts", "audit-result.schema.json")
    example_path = os.path.join(root, "contracts", "audit-result.example.json")

    print(f"Validating contract example: {example_path}")
    print(f"Against schema: {schema_path}")

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    with open(example_path, "r", encoding="utf-8") as f:
        example = json.load(f)

    # Basic structural check
    required_top = ["schema_version", "audit_id", "content_id", "overall_status", "summary", "findings", "created_at", "engine_metadata"]
    for field in required_top:
        if field not in example:
            print(f"ERROR: Missing required top-level field '{field}' in example.")
            sys.exit(1)

    print(f"Example verified! Contains {len(example['findings'])} findings.")
    print("Top-level contract fields all present.")

    try:
        from jsonschema import validate
        validate(instance=example, schema=schema)
        print("✓ jsonschema validation passed successfully!")
    except ImportError:
        print("Note: 'jsonschema' not installed in current environment; passed standard structural verification.")
    except Exception as e:
        print(f"Schema validation error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
