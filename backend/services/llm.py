"""Tiny LLM client: Gemini first, Groq as fallback. Both have free tiers.

generate_json() returns a dict, or None when no provider is configured/working.
Every caller has a rule-based fallback, so the app still runs without any API key.
"""
import json
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

SYSTEM = (
    "You are an experienced, fair interviewer and interview coach for college students in India. "
    "Reply with a single valid JSON object only. No markdown, no commentary."
)


def _extract_json(text: str):
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _gemini(prompt: str) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    resp = requests.post(
        url,
        params={"key": settings.GEMINI_API_KEY},
        json={
            "systemInstruction": {"parts": [{"text": SYSTEM}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.5, "responseMimeType": "application/json"},
        },
        timeout=30,
    )
    resp.raise_for_status()
    return _extract_json(resp.json()["candidates"][0]["content"]["parts"][0]["text"])


def _groq(prompt: str) -> dict:
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        json={
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}],
            "temperature": 0.5,
            "response_format": {"type": "json_object"},
        },
        timeout=30,
    )
    resp.raise_for_status()
    return _extract_json(resp.json()["choices"][0]["message"]["content"])


def generate_json(prompt: str):
    providers = []
    if settings.GEMINI_API_KEY:
        providers.append(("gemini", _gemini))
    if settings.GROQ_API_KEY:
        providers.append(("groq", _groq))
    for name, fn in providers:
        try:
            return fn(prompt)
        except Exception as exc:  # network, quota, bad JSON ... try the next provider
            logger.warning("LLM provider %s failed: %s", name, exc)
    return None
