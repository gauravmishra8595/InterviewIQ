import json
import random
from pathlib import Path

from .evaluator import ROLE_LABELS
from .llm import generate_json

BANK = json.loads((Path(__file__).resolve().parent.parent / "data" / "questions.json").read_text(encoding="utf-8"))

INTRO = "Let's start simple. Tell me about yourself: your background, what you have built, and why this role interests you."


def _bank_question(session, asked, kind):
    if kind == "behavioral" or session.role == "hr":
        pool = BANK["behavioral"][session.difficulty]
        qtype = "behavioral"
    else:
        pool = BANK["roles"].get(session.role, BANK["roles"]["sde"])[session.difficulty]
        qtype = "technical"
    fresh = [q for q in pool if q not in asked] or [q for q in BANK["behavioral"][session.difficulty] if q not in asked]
    if not fresh:
        fresh = pool
    return {"text": random.choice(fresh), "type": qtype}


def _resume_question(session):
    skills = ", ".join(session.skills[:8])
    projects = "; ".join(session.projects[:3])
    data = generate_json(
        f"""
Write ONE interview question for a {ROLE_LABELS.get(session.role, session.role)} candidate based on their resume.
Skills: {skills or 'n/a'}
Projects: {projects or 'n/a'}
Resume excerpt: {session.resume_text[:1500]}
Ask about a specific project or skill, focusing on a real decision, challenge or trade-off.
Keep it under 35 words. Return JSON: {{"question": "..."}}
"""
    )
    if data and isinstance(data.get("question"), str) and data["question"].strip():
        return {"text": data["question"].strip(), "type": "resume"}
    if session.projects:
        project = session.projects[0][:80]
        return {
            "text": f"Tell me about your project \"{project}\". What problem did it solve and what was the hardest technical decision you made?",
            "type": "resume",
        }
    if session.skills:
        return {
            "text": f"Your resume lists {session.skills[0]}. Walk me through a real situation where you used it and what you would improve today.",
            "type": "resume",
        }
    return None


def _followup_question(session, last_turn):
    data = generate_json(
        f"""
You are interviewing a {ROLE_LABELS.get(session.role, session.role)} candidate.
Previous question: {last_turn.question_text}
Candidate answer: {last_turn.answer_text[:1500]}
Ask ONE sharp follow-up that digs into a weak or interesting part of the answer. Under 30 words.
Return JSON: {{"question": "..."}}
"""
    )
    if data and isinstance(data.get("question"), str) and data["question"].strip():
        return {"text": data["question"].strip(), "type": "followup"}
    return None


def next_question(session, turns):
    """Pick the next question. Pattern by index: 0 intro, then resume, technical, follow-up, behavioral, repeat."""
    idx = len(turns)
    asked = {t.question_text for t in turns}
    last = turns[-1] if turns else None

    if idx == 0:
        return {"text": INTRO, "type": "intro"}

    slot = idx % 4
    if slot == 1 and (session.skills or session.projects):
        q = _resume_question(session)
        if q:
            return q
    if slot == 3 and last and last.answer_text and len(last.answer_text.split()) >= 25:
        q = _followup_question(session, last)
        if q:
            return q
    if slot == 0:
        return _bank_question(session, asked, "behavioral")
    return _bank_question(session, asked, "technical")
