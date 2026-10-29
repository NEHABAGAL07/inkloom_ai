"""
Facts Preserved Checker for One-Click Campaign Adaptation.
Extracts numbers, percentages, currency amounts, URLs, and product/brand names from source text.
Ensures no critical factual data is omitted or altered in the adapted variant.
Platform additions like hashtags and emojis are allowed.
"""
import re
from typing import List, Dict, Any, Set, Optional


# Regex patterns for fact extraction
CURRENCY_REGEX = re.compile(
    r'(?:[\$\€\£\¥\₹]|(?:USD|EUR|GBP|CAD|AUD)\s*)\s*\d+(?:[.,]\d+)*(?:\s*(?:k|m|b|million|billion|thousand))?',
    re.IGNORECASE
)
PERCENTAGE_REGEX = re.compile(r'\b\d+(?:[.,]\d+)?\s*%', re.IGNORECASE)
URL_REGEX = re.compile(
    r'(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)',
    re.IGNORECASE
)
# Standalone numbers (integers, floats, comma-separated)
NUMBER_REGEX = re.compile(r'\b\d+(?:[.,]\d+)*(?:\s*(?:k|m|b|million|billion|thousand))?\b', re.IGNORECASE)


def _normalize_token(token: str) -> str:
    """Normalizes token string for comparison (removes outer spaces, trailing punctuation)."""
    return token.strip().rstrip('.,;:!?)"\'').lower()


def extract_facts(text: str, brand_terms: Optional[List[str]] = None) -> Dict[str, Set[str]]:
    """
    Extracts structured facts from text:
    - currencies
    - percentages
    - urls
    - standalone numbers
    - brand / product names
    """
    if not text:
        return {"currencies": set(), "percentages": set(), "urls": set(), "numbers": set(), "brand_terms": set()}

    # 1. Currencies
    currencies = {_normalize_token(m.group(0)) for m in CURRENCY_REGEX.finditer(text)}

    # 2. Percentages
    percentages = {_normalize_token(m.group(0)) for m in PERCENTAGE_REGEX.finditer(text)}

    # 3. URLs
    urls = set()
    for m in URL_REGEX.finditer(text):
        token = _normalize_token(m.group(0))
        # Exclude simple file extensions or plain words like "e.g." or version "v1.0"
        if "." in token and not token.endswith(".") and not token.startswith("e.g"):
            urls.add(token)

    # 4. Numbers (clean out those already captured by currency / percentage / url)
    raw_numbers = set()
    for m in NUMBER_REGEX.finditer(text):
        num_str = _normalize_token(m.group(0))
        # Skip single digits in common words or small indexing like 1. 2.
        raw_numbers.add(num_str)

    # 5. Brand terms
    matched_brand_terms = set()
    if brand_terms:
        for term in brand_terms:
            if not term or len(term.strip()) < 2:
                continue
            pattern = r'\b' + re.escape(term.strip()) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                matched_brand_terms.add(term.strip().lower())

    return {
        "currencies": currencies,
        "percentages": percentages,
        "urls": urls,
        "numbers": raw_numbers,
        "brand_terms": matched_brand_terms
    }


def check_facts_preserved(
    source_text: str,
    variant_text: str,
    brand_terms: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Validates that:
    1. Every number, percentage, currency amount, URL, and brand term present in source_text
       is preserved in variant_text.
    2. No unauthorized new numbers, currency amounts, or percentages are fabricated in variant_text.
    Returns:
        {
            "passed": bool,
            "missing_facts": List[str],
            "added_facts": List[str],
            "details": str
        }
    """
    source_facts = extract_facts(source_text, brand_terms=brand_terms)
    variant_facts = extract_facts(variant_text, brand_terms=brand_terms)

    missing_facts: List[str] = []
    added_facts: List[str] = []

    # Check for missing source facts in variant
    for category in ["currencies", "percentages", "urls", "numbers", "brand_terms"]:
        src_set = source_facts[category]
        var_set = variant_facts[category]
        
        # Numbers might be embedded within currencies or percentages in variant, check containment
        var_full_lower = variant_text.lower()
        for fact in src_set:
            if fact not in var_set and fact not in var_full_lower:
                missing_facts.append(fact)

    # Check for fabricated facts in variant (excluding brand_terms which can be added if approved)
    for category in ["currencies", "percentages"]:
        src_set = source_facts[category]
        var_set = variant_facts[category]
        for fact in var_set:
            if fact not in src_set and fact not in source_text.lower():
                added_facts.append(fact)

    # For standalone numbers in variant, check if they exist in source (ignore hashtag numbers like #top10 if part of hashtag)
    var_numbers = variant_facts["numbers"]
    src_numbers = source_facts["numbers"]
    for num in var_numbers:
        # Ignore common platform structural numbers (e.g. 1, 2, 3 as bullet numbers or 3-8 tags)
        if num in ["1", "2", "3", "4", "5", "10"]:
            continue
        if num not in src_numbers and num not in source_text.lower():
            # Check if it's inside a hashtag in variant
            if f"#{num}" in variant_text or f"#{num}" in variant_text.lower():
                continue
            added_facts.append(num)

    passed = len(missing_facts) == 0 and len(added_facts) == 0

    reasons = []
    if missing_facts:
        reasons.append(f"Missing facts from source: {', '.join(sorted(set(missing_facts)))}")
    if added_facts:
        reasons.append(f"New unauthorized facts introduced: {', '.join(sorted(set(added_facts)))}")

    return {
        "passed": passed,
        "missing_facts": sorted(list(set(missing_facts))),
        "added_facts": sorted(list(set(added_facts))),
        "details": " ; ".join(reasons) if reasons else "All source facts, numbers, and brand terms preserved."
    }

