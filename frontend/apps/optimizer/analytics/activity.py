from ..models import PromptHistory
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate

def get_recent_activity(user, limit=10):
    """
    Returns the user's most recent prompt optimization activity.
    """

    queryset = (
        PromptHistory.objects
        .filter(user=user)
        .order_by("-created_at")[:limit]
    )

    activity = []

    for prompt in queryset:

        activity.append({

            "id": prompt.id,

            "prompt": (
                prompt.original_prompt[:60] + "..."
                if len(prompt.original_prompt) > 60
                else prompt.original_prompt
            ),

            "model": prompt.ai_model,

            "level": prompt.optimization_level,

            "original_tokens": prompt.original_total_tokens,

            "optimized_tokens": prompt.optimized_total_tokens,

            "tokens_saved": prompt.tokens_saved,

            "processing_time": prompt.processing_time,

            "status": prompt.status,

            "created_at": prompt.created_at.strftime(
                "%d %b %Y %I:%M %p"
            ),

        })

    return activity





def get_date_analytics(user):

    queryset = (
        PromptHistory.objects
        .filter(user=user)
        .annotate(
            date=TruncDate("created_at")
        )
        .values("date")
        .annotate(
            total_requests=Count("id"),
            tokens_saved=Sum("tokens_saved"),
            original_tokens=Sum("original_total_tokens"),
            optimized_tokens=Sum("optimized_total_tokens")
        )
        .order_by("date")
    )


    analytics = []


    for item in queryset:

        analytics.append({

            "date": item["date"].strftime(
                "%d %b"
            ),

            "requests":
                item["total_requests"],

            "tokens_saved":
                item["tokens_saved"] or 0,

            "original_tokens":
                item["original_tokens"] or 0,

            "optimized_tokens":
                item["optimized_tokens"] or 0

        })


    return analytics