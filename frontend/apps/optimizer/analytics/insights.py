from django.db.models import Avg, Max, Count

from ..models import PromptHistory


def get_insights_statistics(user):
    """
    Returns AI optimization insights.
    """

    queryset = PromptHistory.objects.filter(user=user)

    if not queryset.exists():

        return {

            "best_optimization_level": "-",

            "most_used_model": "-",

            "highest_cost_saving": 0,

            "average_tokens_saved": 0,

            "fastest_optimization": 0,

            "successful_requests": 0,

        }

    # ---------------------------------------
    # Best Optimization Level
    # ---------------------------------------

    best_level = (

        queryset
        .values("optimization_level")
        .annotate(total=Count("id"))
        .order_by("-total")
        .first()

    )

    # ---------------------------------------
    # Most Used AI Model
    # ---------------------------------------

    most_used_model = (

        queryset
        .values("ai_model")
        .annotate(total=Count("id"))
        .order_by("-total")
        .first()

    )

    # ---------------------------------------
    # Highest Cost Saving
    # ---------------------------------------

    highest_cost_saving = (

        queryset.aggregate(

            highest=Max("estimated_cost_saved")

        )["highest"] or 0

    )

    # ---------------------------------------
    # Average Tokens Saved
    # ---------------------------------------

    average_tokens_saved = (

        queryset.aggregate(

            average=Avg("tokens_saved")

        )["average"] or 0

    )

    # ---------------------------------------
    # Fastest Optimization Time
    # ---------------------------------------

    fastest_optimization = (

        queryset.aggregate(

            fastest=Avg("processing_time")

        )["fastest"] or 0

    )

    # ---------------------------------------
    # Successful Requests
    # ---------------------------------------

    successful_requests = (

        queryset.filter(status="completed").count()

    )

    return {

        "best_optimization_level":
            best_level["optimization_level"],

        "most_used_model":
            most_used_model["ai_model"],

        "highest_cost_saving":
            round(highest_cost_saving, 6),

        "average_tokens_saved":
            round(average_tokens_saved, 2),

        "fastest_optimization":
            round(fastest_optimization, 2),

        "successful_requests":
            successful_requests,

    }