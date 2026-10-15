from django.contrib import admin

from .models import InterviewSession, Turn


class TurnInline(admin.TabularInline):
    model = Turn
    extra = 0
    readonly_fields = ("question_text", "answer_text", "overall_score")


@admin.register(InterviewSession)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "difficulty", "status", "overall_score", "created_at")
    list_filter = ("role", "difficulty", "status")
    inlines = [TurnInline]
