from django.urls import path

from .views import (
    OptimizePromptAPIView,
    PromptingAPIView,
    PromptHistoryAPIView,
    AnalyticsAPIView,
    PromptAnalysisAPIView,
)


urlpatterns = [

    # Existing Optimizer API
    path(
        "optimize/",
        OptimizePromptAPIView.as_view(),
        name="optimize-promt"
    ),

    # New Prompting Panel API
    path(
        "prompting/",
        PromptingAPIView.as_view(),
        name="prompting"
    ),

    # Existing APIs
    path(
        "history/",
        PromptHistoryAPIView.as_view(),
        name="history"
    ),

    path(
        "analytics/",
        AnalyticsAPIView.as_view(),
        name="analytics_api"
    ),

    path(
        "prompt_analysis/",
        PromptAnalysisAPIView.as_view(),
        name="prompt_analysis"
    ),
]