from statistics import mean

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from services.evaluator import evaluate_answer, skipped_evaluation
from services.question_engine import next_question
from services.report import build_report
from services.resume_parser import parse_resume
from services.speech_metrics import compute_metrics

from .models import DIFFICULTY_CHOICES, ROLE_CHOICES, InterviewSession, Turn
from .serializers import SessionListSerializer, SessionSerializer, TurnSerializer

MAX_RESUME_BYTES = 5 * 1024 * 1024


def _create_turn(session, index, question):
    return Turn.objects.create(
        session=session, index=index, question_text=question["text"], question_type=question["type"]
    )


class SessionListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "interview"

    def get(self, request):
        sessions = InterviewSession.objects.filter(user=request.user)
        return Response(SessionListSerializer(sessions, many=True).data)

    def post(self, request):
        role = request.data.get("role", "sde")
        difficulty = request.data.get("difficulty", "medium")
        if role not in dict(ROLE_CHOICES):
            return Response({"role": ["Choose a valid role."]}, status=400)
        if difficulty not in dict(DIFFICULTY_CHOICES):
            return Response({"difficulty": ["Choose easy, medium or hard."]}, status=400)
        try:
            total = max(3, min(10, int(request.data.get("total_questions", 5))))
        except (TypeError, ValueError):
            total = 5

        resume = {"text": "", "skills": [], "projects": []}
        upload = request.FILES.get("resume")
        if upload:
            if upload.size > MAX_RESUME_BYTES:
                return Response({"resume": ["Resume must be under 5 MB."]}, status=400)
            if not upload.name.lower().endswith((".pdf", ".txt")):
                return Response({"resume": ["Upload a PDF or TXT file."]}, status=400)
            try:
                resume = parse_resume(upload)
            except Exception:
                return Response({"resume": ["We could not read that file. Try another PDF."]}, status=400)

        session = InterviewSession.objects.create(
            user=request.user, role=role, difficulty=difficulty, total_questions=total,
            resume_text=resume["text"], skills=resume["skills"], projects=resume["projects"],
        )
        _create_turn(session, 0, next_question(session, []))
        return Response(SessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        return Response(SessionSerializer(session).data)

    def delete(self, request, pk):
        get_object_or_404(InterviewSession, pk=pk, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnswerView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "interview"

    def post(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if session.status == "completed":
            return Response({"detail": "This interview is already finished."}, status=400)
        turn = session.turns.filter(answered_at__isnull=True).order_by("index").first()
        if not turn:
            return Response({"detail": "No open question."}, status=400)

        text = (request.data.get("answer_text") or "").strip()
        skipped = bool(request.data.get("skipped"))
        if not text and not skipped:
            return Response({"detail": "Say or type your answer first, or skip the question."}, status=400)
        try:
            duration = max(0.0, float(request.data.get("duration_seconds") or 0))
        except (TypeError, ValueError):
            duration = 0.0

        if skipped:
            metrics = compute_metrics("", 0)
            result = skipped_evaluation()
        else:
            metrics = compute_metrics(text, duration)
            result = evaluate_answer(turn.question_text, text, session.role, session.difficulty, turn.question_type, metrics)

        turn.answer_text = "" if skipped else text
        turn.skipped = skipped
        turn.duration_seconds = duration
        turn.metrics = metrics
        turn.scores = result["scores"]
        turn.feedback = result["feedback"]
        turn.overall_score = result["overall"]
        turn.answered_at = timezone.now()
        turn.save()

        turns = list(session.turns.order_by("index"))
        answered = sum(1 for t in turns if t.answered_at)
        next_turn = None
        if answered < session.total_questions:
            next_turn = _create_turn(session, len(turns), next_question(session, turns))

        return Response(
            {
                "turn": TurnSerializer(turn).data,
                "next_turn": TurnSerializer(next_turn).data if next_turn else None,
                "finished": next_turn is None,
            }
        )


class FinishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if session.status != "completed":
            session.turns.filter(answered_at__isnull=True).delete()
            turns = list(session.turns.order_by("index"))
            if not turns:
                session.delete()
                return Response({"detail": "Answer at least one question to get a report."}, status=400)
            report = build_report(session, turns)
            session.report = report
            session.overall_score = report["overall"]
            session.status = "completed"
            session.completed_at = timezone.now()
            session.save()
        return Response(SessionSerializer(session).data)


class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        done = list(InterviewSession.objects.filter(user=request.user, status="completed").order_by("created_at"))
        scores = [s.overall_score for s in done if s.overall_score is not None]
        categories = {"content": [], "structure": [], "communication": []}
        for s in done:
            for key in categories:
                value = (s.report or {}).get("averages", {}).get(key)
                if value is not None:
                    categories[key].append(value)
        return Response(
            {
                "completed": len(done),
                "average": round(mean(scores), 1) if scores else None,
                "best": round(max(scores), 1) if scores else None,
                "latest": round(scores[-1], 1) if scores else None,
                "trend": [
                    {"id": str(s.id), "date": s.created_at.isoformat(), "score": s.overall_score, "role": s.role}
                    for s in done[-12:]
                ],
                "categories": {k: (round(mean(v), 1) if v else None) for k, v in categories.items()},
            }
        )
