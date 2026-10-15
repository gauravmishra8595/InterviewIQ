from rest_framework import serializers

from .models import InterviewSession, Turn


class TurnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turn
        fields = [
            "id", "index", "question_text", "question_type", "answer_text", "duration_seconds",
            "skipped", "scores", "feedback", "metrics", "overall_score", "answered_at",
        ]


class SessionSerializer(serializers.ModelSerializer):
    turns = TurnSerializer(many=True, read_only=True)
    answered_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = [
            "id", "role", "difficulty", "total_questions", "status", "skills", "projects",
            "overall_score", "report", "created_at", "completed_at", "answered_count", "turns",
        ]

    def get_answered_count(self, obj):
        return sum(1 for t in obj.turns.all() if t.answered_at)


class SessionListSerializer(serializers.ModelSerializer):
    answered_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = ["id", "role", "difficulty", "total_questions", "status", "overall_score", "created_at", "answered_count"]

    def get_answered_count(self, obj):
        return obj.turns.filter(answered_at__isnull=False).count()
