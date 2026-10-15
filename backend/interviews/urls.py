from django.urls import path

from . import views

urlpatterns = [
    path("", views.SessionListCreateView.as_view()),
    path("stats/", views.StatsView.as_view()),
    path("<uuid:pk>/", views.SessionDetailView.as_view()),
    path("<uuid:pk>/answer/", views.AnswerView.as_view()),
    path("<uuid:pk>/finish/", views.FinishView.as_view()),
]
