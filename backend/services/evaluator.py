import re

from .llm import generate_json

ROLE_LABELS = {
    "sde": "Software Engineer",
    "web": "Web Developer",
    "data_analyst": "Data Analyst",
    "data_scientist": "Data Scientist",
    "hr": "HR / Behavioral round",
}


def _clamp(value, low=0.0, high=10.0):
    try:
        return max(low, min(high, float(value)))
    except (TypeError, ValueError):
        return low


def _llm_eval(question, answer, role, difficulty, question_type):
    prompt = f"""
Evaluate a candidate's spoken interview answer (it is a speech-to-text transcript, so ignore small
transcription slips and missing punctuation).

Role: {ROLE_LABELS.get(role, role)}
Difficulty: {difficulty}
Question type: {question_type}
Question: {question}
Answer: {answer}

Return JSON with exactly these keys:
{{
  "content": number 0-10 (correctness, depth, relevance),
  "structure": number 0-10 (clear order, STAR for behavioral, logical steps for technical),
  "clarity": number 0-10 (concise, easy to follow),
  "strengths": [1-2 short strings],
  "improvements": [1-3 short, specific, actionable strings],
  "better_answer_hint": "2-3 sentences describing what a strong answer would cover"
}}
Be honest and calibrated: a vague 2-sentence answer should not score above 4.
"""
    data = generate_json(prompt)
    if not data:
        return None
    try:
        return {
            "content": _clamp(data["content"]),
            "structure": _clamp(data["structure"]),
            "clarity": _clamp(data["clarity"]),
            "strengths": [str(s) for s in data.get("strengths", [])][:2],
            "improvements": [str(s) for s in data.get("improvements", [])][:3],
            "better_answer_hint": str(data.get("better_answer_hint", "")),
            "source": "ai",
        }
    except (KeyError, TypeError):
        return None


def _keywords(text):
    stop = {"the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "how", "what", "do", "you", "for", "it", "with",
            "on", "your", "would", "me", "about", "explain", "describe", "tell", "when", "between", "difference", "can"}
    return {w for w in re.findall(r"[a-z]{4,}", text.lower()) if w not in stop}


def _rule_eval(question, answer, metrics, question_type):
    words = metrics["word_count"]
    overlap = len(_keywords(question) & _keywords(answer))
    star_hits = sum(metrics["star"].values())

    content = min(10, words / 9) * 0.65 + min(3.5, overlap * 1.2)
    if words < 15:
        content = min(content, 2.5)
    structure = 3 + star_hits * 1.6 + (1.0 if metrics["sentence_count"] >= 4 else 0)
    clarity = 8 - (1.5 if words > 260 else 0) - (2.5 if words < 25 else 0) - min(2.5, metrics["filler_rate"] / 2)

    strengths, improvements = [], []
    if words >= 60:
        strengths.append("You gave a reasonably detailed answer.")
    if star_hits >= 3:
        strengths.append("Your answer had a clear structure (situation, action, result).")
    if metrics["filler_total"] == 0 and words >= 20:
        strengths.append("Clean delivery with no filler words.")
    if words < 40:
        improvements.append("Go deeper: add an example or two more sentences of explanation.")
    if question_type in ("behavioral", "resume", "intro") and star_hits < 3:
        improvements.append("Use STAR: Situation, Task, Action, Result. Finish with a measurable result.")
    if metrics["filler_rate"] > 4:
        improvements.append("Reduce filler words such as 'basically' and 'actually'. Pause instead.")
    if not improvements:
        improvements.append("Add one concrete number or example to make your answer memorable.")
    return {
        "content": _clamp(content),
        "structure": _clamp(structure),
        "clarity": _clamp(clarity),
        "strengths": strengths[:2] or ["You attempted the question and kept going."],
        "improvements": improvements[:3],
        "better_answer_hint": "A strong answer defines the idea, gives a short example, and ends with the trade-off or result.",
        "source": "rules",
    }


def _communication(clarity, metrics):
    score = clarity
    wpm = metrics.get("wpm")
    if wpm:
        if wpm < 95 or wpm > 185:
            score -= 1.0
    if metrics.get("filler_rate", 0) > 6:
        score -= 1.0
    return _clamp(score)


def evaluate_answer(question, answer, role, difficulty, question_type, metrics) -> dict:
    result = _llm_eval(question, answer, role, difficulty, question_type) or _rule_eval(
        question, answer, metrics, question_type
    )
    communication = _communication(result["clarity"], metrics)
    overall = round((result["content"] * 0.5 + result["structure"] * 0.2 + communication * 0.3) * 10, 1)
    return {
        "scores": {
            "content": round(result["content"], 1),
            "structure": round(result["structure"], 1),
            "communication": round(communication, 1),
        },
        "overall": overall,
        "feedback": {
            "strengths": result["strengths"],
            "improvements": result["improvements"],
            "better_answer_hint": result["better_answer_hint"],
            "source": result["source"],
        },
    }


def skipped_evaluation() -> dict:
    return {
        "scores": {"content": 0, "structure": 0, "communication": 0},
        "overall": 0,
        "feedback": {
            "strengths": [],
            "improvements": ["You skipped this question. Even a partial answer earns points and shows your thinking."],
            "better_answer_hint": "",
            "source": "rules",
        },
    }
