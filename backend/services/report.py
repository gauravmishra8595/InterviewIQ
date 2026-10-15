from statistics import mean

from .llm import generate_json


def grade(score: float) -> str:
    if score >= 80:
        return "Interview ready"
    if score >= 65:
        return "Strong, with a few gaps"
    if score >= 50:
        return "Getting there"
    return "Needs more practice"


def _unique(items, limit):
    seen, out = set(), []
    for item in items:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(item.strip())
        if len(out) >= limit:
            break
    return out


def build_report(session, turns) -> dict:
    answered = [t for t in turns if t.answered_at and not t.skipped]
    all_answered = [t for t in turns if t.answered_at]
    if not all_answered:
        return {}

    def avg(key):
        vals = [t.scores.get(key, 0) for t in all_answered]
        return round(mean(vals), 1) if vals else 0

    overall = round(mean(t.overall_score or 0 for t in all_answered), 1)
    wpms = [t.metrics.get("wpm") for t in answered if t.metrics.get("wpm")]

    strengths = _unique([s for t in answered for s in t.feedback.get("strengths", [])], 3)
    improvements = _unique([s for t in answered for s in t.feedback.get("improvements", [])], 4)
    summary = (
        f"You scored {overall:.0f}/100 across {len(all_answered)} questions. "
        f"{'Your strongest area was ' + max(('content', 'structure', 'communication'), key=avg) + '.' if answered else ''}"
    )
    next_steps = ["Retry this role at the same difficulty and aim for +5 points.", "Practise one STAR story out loud every day."]

    digest = "\n".join(
        f"Q{t.index + 1} ({t.question_type}, {t.overall_score:.0f}/100): {t.question_text} | Answer: {t.answer_text[:260]}"
        for t in all_answered
    )
    data = generate_json(
        f"""
Write a short coaching report for a student after a mock interview.
Overall score: {overall}/100. Average content {avg('content')}, structure {avg('structure')}, communication {avg('communication')}.
{digest}
Return JSON: {{"summary": "2-3 encouraging but honest sentences", "strengths": [up to 3 strings],
"improvements": [up to 4 specific strings], "next_steps": [exactly 2 practical strings]}}
"""
    )
    if data:
        summary = str(data.get("summary") or summary)
        strengths = [str(s) for s in data.get("strengths", [])][:3] or strengths
        improvements = [str(s) for s in data.get("improvements", [])][:4] or improvements
        next_steps = [str(s) for s in data.get("next_steps", [])][:2] or next_steps

    return {
        "overall": overall,
        "grade": grade(overall),
        "averages": {"content": avg("content"), "structure": avg("structure"), "communication": avg("communication")},
        "speech": {
            "avg_wpm": round(mean(wpms)) if wpms else None,
            "filler_total": sum(t.metrics.get("filler_total", 0) for t in answered),
            "avg_words": round(mean(t.metrics.get("word_count", 0) for t in answered)) if answered else 0,
        },
        "summary": summary,
        "strengths": strengths,
        "improvements": improvements,
        "next_steps": next_steps,
    }
