from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import OptimizePromptSerializer,PromptHistorySerializer
from .services.optimizer_service import OptimizerService
from .services.history_service import PromptHistoryService
from .services.prompting_service import PromptingService


from .analytics.overview import get_overview_statistics
from .analytics.performance import get_performance_statistics
from .analytics.insights import get_insights_statistics
from .analytics.activity import get_recent_activity,get_date_analytics
from .analytics.status import get_status_statistics


class OptimizePromptAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = OptimizePromptSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        service = OptimizerService()

        result = service.optimize(

            user=request.user,

            prompt=data["prompt"],

            optimization_level=data["optimization_level"],

            provider=data["ai_model"],

        )

        if result["success"]:
            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

class PromptHistoryAPIView(APIView):
    """
    Retrieve prompt history for the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Fetch user's prompt history
        history = PromptHistoryService.get_user_history(request.user)

        # ==========================
        # Terminal Output
        # ==========================
        # print("\n" + "=" * 80)
        # print("                    USER PROMPT HISTORY")
        # print("=" * 80)

        # print(f"Username      : {request.user.username}")
        # print(f"Email         : {request.user.email}")
        # print(f"Total Records : {history.count()}")

        # if not history.exists():
        #     print("\nNo prompt history found for this user.")
        # else:
        #     for index, item in enumerate(history, start=1):

        #         print("\n" + "-" * 80)
        #         print(f"History #{index}")
        #         print("-" * 80)

        #         print(f"ID                    : {item.id}")
        #         print(f"Model                 : {item.ai_model}")
        #         print(f"Optimization Level    : {item.optimization_level}")
        #         print(f"Status                : {item.status}")

        #         print("\nToken Statistics")
        #         print(f"Original Input Tokens : {item.original_input_tokens}")
        #         print(f"Original Output Tokens: {item.original_output_tokens}")
        #         print(f"Optimized Input Tokens: {item.optimized_input_tokens}")
        #         print(f"Optimized Output Tokens: {item.optimized_output_tokens}")
        #         print(f"Original Total Tokens : {item.original_total_tokens}")
        #         print(f"Optimized Total Tokens: {item.optimized_total_tokens}")
        #         print(f"Tokens Saved          : {item.tokens_saved}")

        #         print("\nPerformance")
        #         print(f"Estimated Cost Saved  : ${item.estimated_cost_saved}")
        #         print(f"Processing Time       : {item.processing_time:.2f} sec")

        #         print("\nPrompts")
        #         print(f"Original Prompt:\n{item.original_prompt}\n")
        #         print(f"Optimized Prompt:\n{item.optimized_prompt}\n")

        #         print(f"Created At            : {item.created_at}")
        #         print(f"Updated At            : {item.updated_at}")

        # print("=" * 80 + "\n")

        # Serialize data
        serializer = PromptHistorySerializer(history, many=True)

        return Response(
            {
                "success": True,
                "username":request.user.username,
                "count": history.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

# apps/api/views.py



class AnalyticsAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        overview = get_overview_statistics(request.user)

        performance = get_performance_statistics(request.user)

        insights = get_insights_statistics(request.user)

        activity = get_recent_activity(request.user)

        status = get_status_statistics(request.user)

        date_activity = get_date_analytics(request.user)

        return Response({

            "username": request.user.username,

            "overview": overview,

            "performance": performance,

            "insights": insights,

            "activity": activity,

            "status": status,

            "date_analytics":date_activity,

        })


from .models import PromptHistory


class PromptAnalysisAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        prompts = (
            PromptHistory.objects
            .filter(user=request.user)
            .order_by("-created_at")
        )

        data = []

        for prompt in prompts:

            data.append({

                "id": prompt.id,

                "original_prompt": prompt.original_prompt,

                "optimized_prompt": prompt.optimized_prompt,

                "ai_model": prompt.ai_model,

                "optimization_level": prompt.optimization_level,

                "semantic_accuracy": float(prompt.semantic_accuracy),

                "optimization_score": round(prompt.optimization_score, 2),

                "quality_rating": prompt.quality_rating,

                "original_tokens": prompt.original_total_tokens,

                "optimized_tokens": prompt.optimized_total_tokens,

                "tokens_saved": prompt.tokens_saved,

                "estimated_cost_saved": float(prompt.estimated_cost_saved),

                "processing_time": round(prompt.processing_time, 2),

                "status": prompt.status,

                "created_at": prompt.created_at.strftime(
                    "%d %b %Y %I:%M %p"
                )

            })

        return Response({
            "username":request.user.username,
            "count": len(data),
            "prompts": data     
        })

class PromptingAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        # ==================================================
        # VALIDATE REQUEST
        # ==================================================

        serializer = OptimizePromptSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = serializer.validated_data

        # ==================================================
        # PROMPTING SERVICE
        # ==================================================

        service = PromptingService()

        result = service.optimize(

            user=request.user,

            prompt=data["prompt"],

            optimization_level=(
                data["optimization_level"]
            ),

            provider=data["ai_model"],
        )

        # ==================================================
        # RESPONSE
        # ==================================================

        if result["success"]:

            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )