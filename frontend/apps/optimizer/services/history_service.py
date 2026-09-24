from ..models import PromptHistory


class PromptHistoryService:
    """
    Service responsible for retrieving prompt history.
    """

    @staticmethod
    def get_user_history(user):
        return (
            PromptHistory.objects
            .filter(user=user)
            .order_by("-created_at")
        )