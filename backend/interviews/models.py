import uuid

from django.conf import settings
from django.db import models

ROLE_CHOICES = [
    ("sde", "Software Engineer"),
    ("web", "Web Developer"),
    ("data_analyst", "Data Analyst"),
    ("data_scientist", "Data Scientist"),
    ("hr", "HR / Behavioral"),
]
DIFFICULTY_CHOICES = [("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]


class InterviewSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    total_questions = models.PositiveSmallIntegerField(default=5)
    status = models.CharField(max_length=12, default="in_progress")
    resume_text = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    overall_score = models.FloatField(null=True, blank=True)
    report = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} · {self.role} · {self.created_at:%d %b}"


class Turn(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name="turns")
    index = models.PositiveSmallIntegerField()
    question_text = models.TextField()
    question_type = models.CharField(max_length=12, default="technical")
    answer_text = models.TextField(blank=True)
    duration_seconds = models.FloatField(default=0)
    skipped = models.BooleanField(default=False)
    scores = models.JSONField(default=dict, blank=True)
    feedback = models.JSONField(default=dict, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    overall_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["index"]
        unique_together = ("session", "index")
