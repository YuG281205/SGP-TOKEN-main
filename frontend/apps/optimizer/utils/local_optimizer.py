import re

FILLER_WORDS = [
    "please",
    "kindly",
    "i would like you to",
    "i want you to",
    "could you",
    "can you",
    "would you",
    "if possible",
    "i would appreciate",
    "it would be great if",
    "i need you to",
]

PHRASE_REPLACEMENTS = {
    # --- purpose / causation ---
    "in order to": "to",
    "with the help of": "using",
    "at this point in time": "now",
    "due to the fact that": "because",
    "owing to the fact that": "because",
    "for the reason that": "because",
    "on the grounds that": "because",
    "in light of the fact that": "because",
    "for the purpose of": "for",
    "with the aim of": "to",
    "with a view to": "to",
    "so as to": "to",

    # --- quantity ---
    "a large number of": "many",
    "a great number of": "many",
    "a small number of": "few",
    "a majority of": "most",
    "a minority of": "few",
    "the vast majority of": "most",
    "a wide variety of": "many",
    "a large amount of": "much",
    "a small amount of": "little",
    "a significant amount of": "much",
    "a substantial amount of": "much",
    "a considerable amount of": "much",
    "a limited number of": "few",
    "each and every": "every",
    "the number of": "how many",

    # --- verbs / actions replacing verb phrases ---
    "make use of": "use",
    "provide an explanation of": "explain",
    "give an explanation of": "explain",
    "carry out": "perform",
    "has the ability to": "can",
    "is able to": "can",
    "has the capacity to": "can",
    "in the event that": "if",
    "prior to": "before",
    "subsequent to": "after",
    "as well as": "and",
    "do a comparison of": "compare",
    "make a comparison of": "compare",
    "make a decision": "decide",
    "come to a decision": "decide",
    "reach a decision": "decide",
    "have a discussion": "discuss",
    "engage in a discussion": "discuss",
    "give consideration to": "consider",
    "take into consideration": "consider",
    "conduct an investigation": "investigate",
    "conduct an investigation into": "investigate",
    "perform a calculation": "calculate",
    "carry out a calculation": "calculate",
    "provide assistance": "help",
    "provide assistance to": "help",
    "render assistance": "help",
    "provide information about": "describe",
    "provide information regarding": "describe",
    "is responsible for": "handles",
    "has the capability of": "can",
    "has the capability to": "can",
    "in close proximity to": "near",
    "at the present time": "now",
    "at the current time": "now",
    "in the near future": "soon",
    "on a daily basis": "daily",
    "on a weekly basis": "weekly",
    "on a monthly basis": "monthly",
    "on an annual basis": "annually",
    "on a regular basis": "regularly",
    "on a continuous basis": "continuously",
    "until such time as": "until",

    # --- more purpose / conditional / temporal ---
    "in the case that": "if",
    "in a situation where": "when",
    "under circumstances in which": "when",
    "at such time as": "when",
    "as soon as possible": "soon",
    "in a timely manner": "promptly",
    "in a timely fashion": "promptly",
    "at an early date": "soon",
    "over the course of": "during",
    "for the duration of": "during",
    "in the course of": "during",
    "prior to the time that": "before",
    "in advance of": "before",
    "following on from": "after",
    "in the aftermath of": "after",

    # --- hedging / wordy qualifiers ---
    "it is important to note that": "note that",
    "it should be noted that": "note that",
    "it is worth noting that": "notably,",
    "it is interesting to note that": "interestingly,",
    "needless to say": "clearly,",
    "it is often the case that": "often",
    "it is generally the case that": "generally",
    "in most cases": "usually",
    "in many cases": "often",
    "in some cases": "sometimes",
    "in a number of cases": "sometimes",
    "there is no doubt that": "undoubtedly,",
    "it is possible that": "possibly,",
    "it is likely that": "likely,",
    "it is unlikely that": "unlikely,",

    # --- comparison / contrast ---
    "in comparison to": "compared to",
    "in comparison with": "compared to",
    "as compared to": "compared to",
    "in contrast to": "unlike",
    "on the other hand": "conversely",
    "in spite of the fact that": "although",
    "despite the fact that": "although",
    "regardless of the fact that": "although",
    "even though": "though",
    "with regard to": "regarding",
    "with regards to": "regarding",
    "with respect to": "regarding",
    "in relation to": "regarding",
    "in reference to": "regarding",
    "in terms of": "for",

    # --- business / filler jargon ---
    "at the end of the day": "ultimately",
    "moving forward": "going forward",
    "touch base with": "contact",
    "reach out to": "contact",
    "circle back to": "revisit",
    "get in touch with": "contact",
    "take a look at": "review",
    "keep in mind that": "remember that",
    "bear in mind that": "remember that",
    "it is our understanding that": "we understand that",
    "please be advised that": "note that",
    "for your information": "fyi",
    "for all intents and purposes": "essentially",
    "first and foremost": "first",
    "each and every one of": "all of",
    "the fact of the matter is that": "actually,",
    "the reality of the situation is that": "actually,",

    # --- academic wordiness ---
    "conduct an analysis of": "analyze",
    "perform an analysis of": "analyze",
    "make an assessment of": "assess",
    "conduct an assessment of": "assess",
    "provide a summary of": "summarize",
    "give a summary of": "summarize",
    "provide a description of": "describe",
    "give a description of": "describe",
    "make an attempt to": "try to",
    "put forth an effort to": "try to",
    "come to the conclusion that": "conclude that",
    "arrive at the conclusion that": "conclude that",
    "draw the conclusion that": "conclude that",
    "formulate a plan for": "plan",
    "develop a strategy for": "plan",
    "engage in the process of": "start",
    "undergo the process of": "go through",

    # --- redundancy pairs ---
    "past history": "history",
    "future plans": "plans",
    "end result": "result",
    "final outcome": "outcome",
    "basic fundamentals": "fundamentals",
    "true facts": "facts",
    "unexpected surprise": "surprise",
    "close proximity": "proximity",
    "advance planning": "planning",
    "completely eliminate": "eliminate",
    "absolutely essential": "essential",
    "each individual": "each",
    "free gift": "gift",
    "new innovation": "innovation",
    "brief summary": "summary",
    "close scrutiny": "scrutiny",

    # --- requests ---
    "i was wondering if you could": "please",
    "i was hoping you could": "please",
    "would it be possible for you to": "please",
    "if you would be so kind as to": "please",
    "it would be helpful if you could": "please",
}

# --- Prompt-specific patterns -------------------------------------------
# These target the way people phrase *requests to an AI* specifically
# (as opposed to general wordy English). The goal is to turn a polite
# wrapper + verb into a direct imperative, e.g.:
#   "Please explain in detail ..."      -> "Explain ..."
#   "Can you generate ..."              -> "Generate ..."
#   "Could you please summarize ..."    -> "Summarize ..."
#   "I would like you to write ..."     -> "Write ..."
# Longest phrases are matched first so "could you please" isn't cut short
# by the shorter "could you" alternative.
REQUEST_PREFIXES = [
    "i would appreciate it if you could",
    "i would appreciate it if you would",
    "i would like you to",
    "i was wondering if you could",
    "i was hoping you could",
    "do you think you could",
    "would you be able to",
    "i want you to",
    "i need you to",
    "could you please",
    "can you please",
    "would you please",
    "will you please",
    "could you kindly",
    "can you kindly",
    "could you",
    "can you",
    "would you",
    "will you",
    "please",
]

# Verbosity qualifiers that tack onto a verb without changing the core ask,
# e.g. "explain in detail" / "describe thoroughly" -> just the verb.
VERBOSITY_QUALIFIERS = [
    "in a lot of detail",
    "in great detail",
    "in much detail",
    "in detail",
    "in-depth",
    "in depth",
    "step by step",
    "comprehensively",
    "thoroughly",
]

_REQUEST_PREFIX_SORTED = sorted(REQUEST_PREFIXES, key=len, reverse=True)
_VERBOSITY_SORTED = sorted(VERBOSITY_QUALIFIERS, key=len, reverse=True)

REQUEST_PREFIX_PATTERN = re.compile(
    r"^(?:" + "|".join(re.escape(p) for p in _REQUEST_PREFIX_SORTED) + r")\s+",
    re.IGNORECASE,
)

VERBOSITY_PATTERN = re.compile(
    r"\s+(?:" + "|".join(re.escape(v) for v in _VERBOSITY_SORTED) + r")\b",
    re.IGNORECASE,
)

# Sort longest-first so overlapping phrases don't get partially matched.
_FILLER_SORTED = sorted(FILLER_WORDS, key=len, reverse=True)
_PHRASE_SORTED = sorted(PHRASE_REPLACEMENTS.keys(), key=len, reverse=True)

# Compiled once, at import time.
# Also swallow a trailing comma/space so we don't leave orphaned punctuation
# like ", explain that" after stripping "could you".
def _filler_alternative(word):
    # "would you" / "will you" are safe to strip on their own, but not when
    # followed by "mind" (e.g. "would you mind reviewing ...") — stripping
    # there leaves a dangling gerund ("Mind reviewing ...") since we can't
    # reliably convert gerunds to imperatives for irregular verbs.
    if word.lower() in ("would you", "will you"):
        return re.escape(word) + r"(?!\s+mind\b)"
    return re.escape(word)


FILLER_PATTERN = re.compile(
    r"\b(?:" + "|".join(_filler_alternative(w) for w in _FILLER_SORTED) + r")\b[,]?\s*",
    re.IGNORECASE,
)

PHRASE_PATTERN = re.compile(
    r"\b(?:" + "|".join(re.escape(p) for p in _PHRASE_SORTED) + r")\b",
    re.IGNORECASE,
)

# Lowercase key -> replacement, for the phrase-replacement callback.
_PHRASE_LOOKUP = {k.lower(): v for k, v in PHRASE_REPLACEMENTS.items()}

# --- Safety: words that flip or restrict meaning ------------------------
# These must never be silently dropped by any optimization step, since
# removing them changes what the prompt actually says (a scope/negation
# word disappearing is a correctness bug, not just a style choice).
CRITICAL_WORDS = [
    "not",
    "never",
    "only",
    "except",
    "without",
    "unless",
    "must",
]

_CRITICAL_WORD_PATTERNS = {
    w: re.compile(r"\b" + re.escape(w) + r"\b", re.IGNORECASE) for w in CRITICAL_WORDS
}


def _critical_words_in(text):
    """Set of critical words that appear (as whole words) in text."""
    return {w for w, pat in _CRITICAL_WORD_PATTERNS.items() if pat.search(text)}


def preserves_critical_words(before, after):
    """True if no critical word present in `before` has vanished from `after`.

    Note this is a "did it disappear entirely" check, not a raw count
    comparison — e.g. remove_duplicate_sentences collapsing two identical
    sentences that both contain "must" is fine (one instance survives);
    a phrase replacement that turns "must" into nothing would not be.
    """
    return _critical_words_in(before) <= _critical_words_in(after)


def _safe_step(step_fn, text):
    """Run a transformation step, but reject its output if it caused any
    critical word to disappear entirely — falling back to the pre-step
    text (and a zeroed-out stats value) instead. This is a runtime safety
    net on top of the static validation below, in case some combination
    of rules has an effect that wasn't obvious from any single entry.

    step_fn must return (new_text, info), where info is either an int
    count or a dict of counts — whichever shape the caller expects back.
    """
    new_text, info = step_fn(text)
    if preserves_critical_words(text, new_text):
        return new_text, info
    zero_info = {k: 0 for k in info} if isinstance(info, dict) else 0
    return text, zero_info


def _validate_word_lists():
    """Fail fast (at import time) if any filler/prefix/qualifier/phrase
    entry would delete a critical word outright. This is what would have
    caught the old "whether or not" -> "whether" bug, which silently
    dropped a "not" — before it ever reached a user's prompt."""
    problems = []

    for phrase in FILLER_WORDS + REQUEST_PREFIXES + VERBOSITY_QUALIFIERS:
        removed = _critical_words_in(phrase)
        if removed:
            problems.append(
                f"filler/prefix/qualifier {phrase!r} contains critical word(s) "
                f"{sorted(removed)} that would be deleted outright"
            )

    for original, replacement in PHRASE_REPLACEMENTS.items():
        lost = _critical_words_in(original) - _critical_words_in(replacement)
        if lost:
            problems.append(
                f"phrase replacement {original!r} -> {replacement!r} drops "
                f"critical word(s) {sorted(lost)}"
            )

    if problems:
        raise ValueError(
            "Unsafe word-list entries detected (would silently change prompt "
            "meaning):\n  " + "\n  ".join(problems)
        )


_validate_word_lists()

# Common abbreviations that shouldn't be treated as sentence boundaries.
_ABBREVIATIONS = {
    "mr.", "mrs.", "ms.", "dr.", "prof.", "sr.", "jr.",
    "vs.", "etc.", "e.g.", "i.e.", "fig.", "no.", "approx.",
}


def normalize_whitespace(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def simplify_prompt_requests(text, remove_verbosity=False):
    """Turn polite AI-prompt wrappers into direct imperatives.

    Handles the common "how people phrase requests to an AI" patterns:
        "Please explain how X works."             -> "Explain how X works."
        "Can you generate a list of ideas?"       -> "Generate a list of ideas."
        "Could you please summarize this?"        -> "Summarize this."
        "I would like you to write a poem."       -> "Write a poem."

    This is distinct from remove_filler_words: that function strips loose
    politeness words wherever they appear, while this one specifically
    recognizes a *request wrapper at the start of a sentence*, strips it,
    re-capitalizes the result, and — since a stripped wrapper means the
    sentence is no longer phrased as a question — turns a trailing "?"
    into a "." when appropriate.

    remove_verbosity: if True, also strips quality/depth qualifiers like
    "in detail", "thoroughly", "comprehensively", "step by step". These
    are left OFF by default because they're often an actual requirement
    ("explain in detail" asks for a deeper answer than "explain"), not
    just verbal filler — so basic optimization preserves them and only
    aggressive optimization removes them.

    Returns (new_text, stats) where stats is a dict with:
        "requests_simplified": sentences where a request wrapper was stripped
        "qualifiers_removed": count of verbosity qualifiers stripped
                               (always 0 when remove_verbosity is False)
    """
    sentences = _split_sentences(text)
    result = []
    stats = {"requests_simplified": 0, "qualifiers_removed": 0}

    for sentence in sentences:
        stripped = sentence.strip()
        if not stripped:
            continue

        match = REQUEST_PREFIX_PATTERN.match(stripped)
        was_request = False
        if match:
            matched_text = stripped[:match.end()]
            remainder = stripped[match.end():]
            # "would/will you" is a valid prefix on its own, but "would you
            # mind reviewing ..." needs gerund->imperative conversion
            # ("reviewing" -> "review") which we can't do reliably for
            # irregular verbs. Rather than emit a broken sentence like
            # "Mind reviewing this contract.", leave it untouched.
            if (
                matched_text.strip().lower() in ("would you", "will you")
                and remainder.lower().startswith("mind ")
            ):
                pass
            else:
                stripped = remainder
                was_request = True
                stats["requests_simplified"] += 1

        if remove_verbosity:
            stripped, n = VERBOSITY_PATTERN.subn("", stripped)
            if n:
                stats["qualifiers_removed"] += n
                # Collapse artifacts left behind, e.g. "explain,, why" or
                # "explain, why" (from "explain, thoroughly, why").
                stripped = re.sub(r"\s*,\s*,\s*", ", ", stripped)
                stripped = re.sub(r"\s{2,}", " ", stripped).strip()

        if was_request and stripped.endswith("?"):
            stripped = stripped[:-1].rstrip() + "."

        if stripped:
            stripped = stripped[0].upper() + stripped[1:]
            result.append(stripped)

    return " ".join(result), stats


def remove_filler_words(text):
    text, count = FILLER_PATTERN.subn("", text)
    # Clean up any leading punctuation/space left behind after a strip,
    # e.g. "Hello, please explain" -> "Hello,  explain" -> "Hello explain"
    text = re.sub(r"\s*,\s*", ", ", text)
    text = re.sub(r"^\s*,\s*", "", text)
    text = re.sub(r",\s*([.!?])", r"\1", text)
    return text, count


def replace_common_phrases(text):
    count = 0

    def _replace(match):
        nonlocal count
        matched = match.group(0)
        replacement = _PHRASE_LOOKUP[matched.lower()]
        # Per-match guard: if this specific phrase carries a critical word
        # that the replacement doesn't, leave the original text as-is
        # instead of substituting. (Belt-and-suspenders: _validate_word_lists
        # already rejects such entries at import time, but this protects
        # against edge cases like a critical word appearing only because
        # of surrounding text captured oddly by the match.)
        if not preserves_critical_words(matched, replacement):
            return matched
        count += 1
        return replacement

    new_text = PHRASE_PATTERN.sub(_replace, text)
    return new_text, count


def remove_repeated_punctuation(text):
    # Handles both same-character runs ("!!!") and mixed runs ("!?!", "?!.")
    return re.sub(r"([!?.,])[!?.,]*", r"\1", text)


def _looks_like_abbreviation(sentence_end_fragment):
    """Check whether the text right before a split point is a known abbreviation."""
    tail = sentence_end_fragment.strip().split(" ")[-1].lower()
    return tail in _ABBREVIATIONS


def _split_sentences(text):
    # Split on sentence-ending punctuation followed by whitespace. Decimals
    # (3.14) are naturally safe since there's no whitespace right after the
    # period. Abbreviations (Dr. Smith, e.g. ...) are merged back below via
    # _looks_like_abbreviation, rather than by requiring the next sentence
    # to start with a capital letter — that requirement used to cause real
    # sentence boundaries to be missed whenever the next sentence happened
    # to start lowercase (e.g. after a phrase replacement), which silently
    # broke duplicate-sentence detection.
    raw_parts = re.split(r'(?<=[.!?])\s+', text)

    merged = []
    for part in raw_parts:
        if merged and _looks_like_abbreviation(merged[-1]):
            merged[-1] = merged[-1] + " " + part
        else:
            merged.append(part)
    return merged


def remove_duplicate_sentences(text):
    sentences = _split_sentences(text)

    seen = set()
    result = []
    duplicates = 0

    for sentence in sentences:
        key = sentence.strip().lower()
        if not key:
            continue
        if key not in seen:
            seen.add(key)
            result.append(sentence.strip())
        else:
            duplicates += 1

    return " ".join(result), duplicates


# Matches a word immediately followed by one or more repeats of itself,
# e.g. "the the cat" or "very very tired" (case-insensitive, so "The the"
# still counts). Collapses to a single instance of the word.
DUPLICATE_WORD_PATTERN = re.compile(r"\b(\w+)(?:\s+\1\b)+", re.IGNORECASE)


def remove_duplicate_words(text):
    count = 0

    def _replace(match):
        nonlocal count
        full, word = match.group(0), match.group(1)
        occurrences = len(re.findall(r"\b" + re.escape(word) + r"\b", full, re.IGNORECASE))
        count += occurrences - 1
        return word

    new_text = DUPLICATE_WORD_PATTERN.sub(_replace, text)
    return new_text, count


def remove_extra_spaces(text):
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,!?])", r"\1", text)
    return text.strip()


def fix_capitalization(text):
    """Ensure each sentence starts with an uppercase letter (filler removal
    can otherwise leave a sentence starting mid-word/lowercase)."""
    sentences = _split_sentences(text)
    fixed = []
    for s in sentences:
        s = s.strip()
        if s:
            s = s[0].upper() + s[1:]
        fixed.append(s)
    return " ".join(fixed)


def _word_count(text):
    return len(text.split())


def optimize_prompt_locally(prompt, mode="basic"):
    """Run the full local optimization pipeline.

    mode:
        "basic" (default) — safe, conservative cleanup. Quality/depth
            qualifiers like "in detail", "step by step", "thoroughly",
            and "comprehensively" are LEFT IN, since they're often an
            actual requirement ("explain in detail" wants a deeper
            answer than "explain") rather than throwaway wordiness.
        "aggressive" — everything "basic" does, plus strips those
            qualifiers too, for maximum token compression.

    Returns:
        {
            "optimized_prompt": str,
            "stats": {
                "filler_removed": int,          # filler words/phrases stripped
                "phrases_replaced": int,        # wordy phrases replaced
                "qualifiers_removed": int,      # "in detail" etc. (aggressive only)
                "requests_simplified": int,     # "Can you..." -> imperative
                "duplicate_sentences": int,     # exact repeated sentences collapsed
                "duplicate_words": int,         # immediate repeated words collapsed
                "original_word_count": int,
                "optimized_word_count": int,
                "reduction_percentage": float,  # e.g. 26.6
            }
        }
    """
    if mode not in ("basic", "aggressive"):
        raise ValueError("mode must be 'basic' or 'aggressive'")
    aggressive = mode == "aggressive"

    original_word_count = _word_count(prompt)

    text = normalize_whitespace(prompt)

    text, request_stats = _safe_step(
        lambda t: simplify_prompt_requests(t, remove_verbosity=aggressive), text
    )
    text, filler_count = _safe_step(remove_filler_words, text)
    text, phrase_count = _safe_step(replace_common_phrases, text)

    text = remove_repeated_punctuation(text)
    text = fix_capitalization(text)

    text, duplicate_sentence_count = _safe_step(remove_duplicate_sentences, text)
    text, duplicate_word_count = _safe_step(remove_duplicate_words, text)

    text = remove_extra_spaces(text)
    text = fix_capitalization(text)

    optimized_word_count = _word_count(text)
    reduction_percentage = (
        round((1 - optimized_word_count / original_word_count) * 100, 1)
        if original_word_count
        else 0.0
    )

    stats = {
        "filler_removed": filler_count,
        "phrases_replaced": phrase_count,
        "qualifiers_removed": request_stats["qualifiers_removed"],
        "requests_simplified": request_stats["requests_simplified"],
        "duplicate_sentences": duplicate_sentence_count,
        "duplicate_words": duplicate_word_count,
        "original_word_count": original_word_count,
        "optimized_word_count": optimized_word_count,
        "reduction_percentage": reduction_percentage,
    }

    return {"optimized_prompt": text, "stats": stats}

