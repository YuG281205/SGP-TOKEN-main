from django.db.models import Count, Sum

from ..models import PromptHistory


def get_performance_statistics(user):
    """
    Returns analytics data for performance charts.
    """

    queryset = PromptHistory.objects.filter(user=user)

    # -------------------------------
    # Token Usage Chart
    # -------------------------------

    token_usage = {
        "original_tokens": queryset.aggregate(
            total=Sum("original_total_tokens")
        )["total"] or 0,

        "optimized_tokens": queryset.aggregate(
            total=Sum("optimized_total_tokens")
        )["total"] or 0,

        "saved_tokens": queryset.aggregate(
            total=Sum("tokens_saved")
        )["total"] or 0,
    }

    # -------------------------------
    # AI Model Usage
    # -------------------------------

    model_usage = list(

        queryset.values("ai_model")
        .annotate(total=Count("id"))
        .order_by("-total")

    )

    # -------------------------------
    # Optimization Level Distribution
    # -------------------------------

    optimization_levels = list(

        queryset.values("optimization_level")
        .annotate(total=Count("id"))
        .order_by("-total")

    )

    return {
        "token_usage": token_usage,
        "model_usage": model_usage,
        "optimization_levels": optimization_levels,
    }