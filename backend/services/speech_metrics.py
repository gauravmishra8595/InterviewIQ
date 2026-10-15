import re

FILLERS = ["um", "umm", "uh", "uhh", "erm", "you know", "i mean", "kind of", "sort of", "basically", "actually", "literally"]

STAR_MARKERS = {
    "situation": ["situation", "when i was", "during my", "in my project", "in my internship", "at my college", "last year", "once,"],
    "task": ["task", "my role", "responsible", "my goal", "needed to", "had to", "challenge"],
    "action": ["i built", "i created", "i implemented", "i decided", "i led", "i designed", "i used", "i worked", "i wrote", "i developed", "i organised", "i organized"],
    "result": ["result", "outcome", "achieved", "improved", "reduced", "increased", "%", "learned", "delivered", "as a result"],
}


def _count(phrase: str, text: str) -> int:
    return len(re.findall(r"(?<![a-z])" + re.escape(phrase) + r"(?![a-z])", text))


def compute_metrics(answer: str, duration_seconds: float) -> dict:
    text = (answer or "").lower()
    words = re.findall(r"[a-zA-Z0-9'+#.%-]+", text)
    word_count = len(words)
    sentences = [s for s in re.split(r"[.!?]+", answer or "") if s.strip()]

    fillers = {}
    for f in FILLERS:
        n = _count(f, text)
        if n:
            fillers[f] = n
    filler_total = sum(fillers.values())

    wpm = None
    if duration_seconds and duration_seconds >= 8 and word_count >= 10:
        wpm = round(word_count / (duration_seconds / 60))

    star = {k: any(m in text for m in markers) for k, markers in STAR_MARKERS.items()}

    return {
        "word_count": word_count,
        "sentence_count": len(sentences),
        "duration_seconds": round(duration_seconds or 0, 1),
        "wpm": wpm,
        "filler_total": filler_total,
        "filler_rate": round(filler_total / word_count * 100, 1) if word_count else 0,
        "fillers": fillers,
        "star": star,
    }
