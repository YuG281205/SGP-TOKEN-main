from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.comparison1.models import ComparisonHistory

class ComparisonHistoryAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        comparisons = (
            ComparisonHistory.objects
            .filter(history__user=request.user)
            .select_related("history")
            .order_by("-created_at")
        )

        data = []

        for comparison in comparisons:

            data.append({

                "id": comparison.id,

                "history_id": comparison.history.id,

                "optimizer_name": comparison.optimizer_name,

                "original_prompt": comparison.history.original_prompt,

                "optimized_prompt": comparison.optimized_prompt,

                "optimized_input_tokens": comparison.optimized_input_tokens,

                "optimized_output_tokens": comparison.optimized_output_tokens,

                "optimized_total_tokens": comparison.optimized_total_tokens,

                "tokens_saved": comparison.tokens_saved,

                "semantic_accuracy": float(comparison.semantic_accuracy),

                "optimization_score": float(comparison.optimization_score),

                "estimated_cost_saved": float(comparison.estimated_cost_saved),

                "processing_time": float(comparison.processing_time),

                "status": comparison.status,

                "error_message": comparison.error_message,

                "optimized_prompt_image": (
                    comparison.optimized_prompt_image.url
                    if comparison.optimized_prompt_image
                    else None
                ),

                "created_at": comparison.created_at.strftime(
                    "%d %b %Y %I:%M %p"
                ),

            })

        return Response(
            {
                "success": True,
                "username": request.user.username,
                "count": len(data),
                "comparisons": data,
            },
            status=status.HTTP_200_OK,
        )