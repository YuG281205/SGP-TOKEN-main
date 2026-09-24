from django.db.models import Avg, Count, Sum

from ..models import PromptHistory


def get_overview_statistics(user):
    """
    Calculate overview statistics for the Analytics dashboard.
    """

    queryset = PromptHistory.objects.filter(user=user)

    aggregates = queryset.aggregate(
        total_optimizations=Count("id"),
        total_token_usage=Sum("original_total_tokens"),
        total_optimized_tokens=Sum("optimized_total_tokens"),
        total_tokens_saved=Sum("tokens_saved"),
        total_cost_saved=Sum("estimated_cost_saved"),
        average_processing_time=Avg("processing_time"),
    )

    completed = queryset.filter(status="completed").count()
    total = aggregates["total_optimizations"] or 0

    success_rate = 0
    if total > 0:
        success_rate = round((completed / total) * 100, 2)

    original_tokens = aggregates["total_token_usage"] or 0
    saved_tokens = aggregates["total_tokens_saved"] or 0

    average_reduction = 0
    if original_tokens > 0:
        average_reduction = round(
            (saved_tokens / original_tokens) * 100,
            2,
        )

    return {
        "total_optimizations": total,
        "total_token_usage": original_tokens,
        "total_optimized_tokens": (
            aggregates["total_optimized_tokens"] or 0
        ),
        "total_tokens_saved": saved_tokens,
        "average_reduction": average_reduction,
        "total_cost_saved": (
            aggregates["total_cost_saved"] or 0
        ),
        "success_rate": success_rate,
        "average_processing_time": round(
            aggregates["average_processing_time"] or 0,
            2,
        ),
    }