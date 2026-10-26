"""
BM25 Information Retrieval Engine with Brand Synonym Query Expansion
Implements Okapi BM25 ranking (k1=1.5, b=0.75) optimized for brand manuals and guideline passages.
Zero external heavy dependencies.
"""
import math
import re
from typing import List, Dict, Set, Tuple, Any, Optional

# Brand-domain synonym clusters for semantic query expansion
BRAND_SYNONYM_MAP: Dict[str, Set[str]] = {
    "logo": {"logo", "wordmark", "lockup", "logomark", "symbol", "mark", "brandmark"},
    "wordmark": {"logo", "wordmark", "lockup", "logomark"},
    "lockup": {"logo", "wordmark", "lockup"},
    "white": {"white", "reversed", "knockout", "inverted", "light"},
    "reversed": {"white", "reversed", "knockout", "inverted"},
    "knockout": {"white", "reversed", "knockout"},
    "dark": {"dark", "navy", "black", "deep", "reversed"},
    "blue": {"blue", "navy", "azure", "cobalt", "sapphire"},
    "navy": {"navy", "dark", "blue"},
    "background": {"background", "backdrop", "field", "canvas"},
    "font": {"font", "typography", "typeface", "type", "weight"},
    "typography": {"font", "typography", "typeface", "type"},
    "color": {"color", "colour", "palette", "hex", "rgb", "pantone", "hue"},
    "colour": {"color", "colour", "palette", "hex", "rgb"},
    "palette": {"color", "colour", "palette", "swatch"},
    "spacing": {"spacing", "clearspace", "clearance", "margin", "padding", "buffer"},
    "clearspace": {"spacing", "clearspace", "clearance", "margin", "padding"},
    "margin": {"spacing", "clearspace", "clearance", "margin"},
    "icon": {"icon", "symbol", "glyph", "pictogram"},
    "tagline": {"tagline", "slogan", "motto"},
    "prohibited": {"prohibited", "forbidden", "disallowed", "restricted", "never"},
    "required": {"required", "mandatory", "must", "obligatory"},
}

STOP_WORDS = {
    "a", "an", "the", "and", "or", "is", "in", "it", "to", "for", "with",
    "on", "at", "by", "from", "of", "as", "be", "this", "that", "are",
    "was", "were", "been", "has", "have", "had", "do", "does", "did",
}


def tokenize(text: str) -> List[str]:
    """Tokenize string into lowercase alphanumeric words."""
    if not text:
        return []
    tokens = re.findall(r"\b[a-zA-Z0-9_\-]+\b", text.lower())
    return [t for t in tokens if len(t) > 1 and t not in STOP_WORDS]


def expand_query_terms(tokens: List[str]) -> List[Tuple[str, float]]:
    """
    Expands query tokens using brand domain synonyms.
    Returns list of (term, weight) tuples where original terms have weight 1.0,
    and synonyms have weight 0.85.
    """
    weighted_terms: Dict[str, float] = {}
    for token in tokens:
        weighted_terms[token] = max(weighted_terms.get(token, 0.0), 1.0)
        synonyms = BRAND_SYNONYM_MAP.get(token, set())
        for syn in synonyms:
            if syn not in weighted_terms:
                weighted_terms[syn] = 0.85

    return list(weighted_terms.items())


class BM25Retriever:
    """
    Okapi BM25 implementation for indexing and scoring document chunks and rules.
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.documents: List[Dict[str, Any]] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_length: float = 0.0
        self.doc_freqs: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.corpus_size: int = 0

    def fit(self, documents: List[Dict[str, Any]]) -> "BM25Retriever":
        """
        Fit BM25 statistics over a list of document dicts.
        Each document must contain a 'text' key.
        """
        self.documents = documents
        self.corpus_size = len(documents)
        if self.corpus_size == 0:
            self.avg_doc_length = 0.0
            return self

        self.doc_lengths = []
        self.doc_freqs = {}

        total_length = 0
        for doc in documents:
            text = doc.get("text", "")
            tokens = tokenize(text)
            self.doc_lengths.append(len(tokens))
            total_length += len(tokens)

            # Record unique terms for document frequencies
            seen_terms = set(tokens)
            for term in seen_terms:
                self.doc_freqs[term] = self.doc_freqs.get(term, 0) + 1

        self.avg_doc_length = total_length / self.corpus_size if self.corpus_size > 0 else 0.0

        # Calculate IDF using standard Okapi BM25 formula
        self.idf = {}
        for term, df in self.doc_freqs.items():
            self.idf[term] = math.log(((self.corpus_size - df + 0.5) / (df + 0.5)) + 1.0)

        return self

    def score_document(
        self,
        doc_idx: int,
        weighted_query_terms: List[Tuple[str, float]],
    ) -> float:
        """Calculate BM25 relevance score for a single document against weighted terms."""
        if doc_idx >= len(self.documents):
            return 0.0

        doc_text = self.documents[doc_idx].get("text", "")
        doc_tokens = tokenize(doc_text)
        doc_len = self.doc_lengths[doc_idx]

        # Term counts in document
        term_counts: Dict[str, int] = {}
        for token in doc_tokens:
            term_counts[token] = term_counts.get(token, 0) + 1

        score = 0.0
        len_norm = 1.0 - self.b + self.b * (doc_len / self.avg_doc_length) if self.avg_doc_length > 0 else 1.0

        for term, term_weight in weighted_query_terms:
            tf = term_counts.get(term, 0)
            if tf > 0:
                idf_val = self.idf.get(term, 0.0)
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * len_norm
                term_score = idf_val * (numerator / denominator) if denominator > 0 else 0.0
                score += term_score * term_weight

        return score

    def search(self, query: str, top_k: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        """
        Searches index with brand synonym expansion and returns top-k documents sorted by score.
        """
        if not self.documents:
            return []

        raw_tokens = tokenize(query)
        if not raw_tokens:
            return []

        weighted_terms = expand_query_terms(raw_tokens)

        scored: List[Tuple[Dict[str, Any], float]] = []
        for idx, doc in enumerate(self.documents):
            score = self.score_document(idx, weighted_terms)
            if score > 0.0:
                scored.append((doc, score))

        # Sort descending by score
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
