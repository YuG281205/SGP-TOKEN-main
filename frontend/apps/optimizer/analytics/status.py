from django.db.models import Count

from ..models import PromptHistory


def get_status_statistics(user):
    """
    Returns prompt optimization status statistics.
    """

    queryset = PromptHistory.objects.filter(user=user)

    total_requests = queryset.count()

    completed = queryset.filter(status="completed").count()

    failed = queryset.filter(status="failed").count()

    pending = queryset.filter(status="pending").count()

    success_rate = (
        round((completed / total_requests) * 100, 2)
        if total_requests > 0
        else 0
    )

    failure_rate = (
        round((failed / total_requests) * 100, 2)
        if total_requests > 0
        else 0
    )

    pending_rate = (
        round((pending / total_requests) * 100, 2)
        if total_requests > 0
        else 0
    )

    status_distribution = list(

        queryset
        .values("status")
        .annotate(total=Count("id"))
        .order_by("-total")

    )

    return {

        "summary": {

            "total_requests": total_requests,

            "completed": completed,

            "failed": failed,

            "pending": pending,

            "success_rate": success_rate,

            "failure_rate": failure_rate,

            "pending_rate": pending_rate,

        },

        "distribution": status_distribution,

    }