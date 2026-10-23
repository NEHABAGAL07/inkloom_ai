#!/usr/bin/env python3
"""Validates the audit result example against the audit result JSON Schema."""

import json
import os
import sys

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    schema_path = os.path.join(root_dir, "contracts", "audit-result.schema.json")
    example_path = os.path.join(root_dir, "contracts", "audit-result.example.json")

    print(f"Loading schema from: {schema_path}")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    print(f"Loading example from: {example_path}")
    with open(example_path, "r", encoding="utf-8") as f:
        example = json.load(f)

    try:
        import jsonschema
        jsonschema.validate(instance=example, schema=schema)
        print(" SUCCESS: contracts/audit-result.example.json strictly conforms to audit-result.schema.json!")
    except ImportError:
        print("Note: 'jsonschema' package not installed. Performing structural verification...")
        required = schema.get("required", [])
        missing = [f for f in required if f not in example]
        if missing:
            print(f" ERROR: Example is missing required fields: {missing}")
            sys.exit(1)
        print(" SUCCESS: Basic structural verification passed.")

if __name__ == "__main__":
    main()
