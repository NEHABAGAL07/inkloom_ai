#!/usr/bin/env python3
"""Seeds demonstration brand guidelines and sample approved assets for local development."""

import json
import os

DEMO_DATA = {
    "organization": {
        "id": "org-inkloom-demo-001",
        "name": "Acme Global Enterprise",
        "slug": "acme-global",
    },
    "guidelines": [
        {
            "id": "gd-brand-voice",
            "name": "Brand Voice & Editorial Standards",
            "category": "tone_and_voice",
            "version": "2.4",
        },
        {
            "id": "gd-legal-claims",
            "name": "Legal Substantiation & Claim Standards",
            "category": "claim_verification",
            "version": "3.0",
        },
    ],
    "approved_claims": [
        "Enterprise SOC2 Type II Certified",
        "Analyzes over 10 million brand assets annually",
    ],
}

def main():
    print("Inkloom AI — Demo Data Seed Generator")
    print(json.dumps(DEMO_DATA, indent=2))
    print("\n[OK] Demonstration entities defined and ready for database migration seeding.")

if __name__ == "__main__":
    main()
