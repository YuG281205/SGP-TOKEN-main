from rest_framework import serializers
from .models import PromptHistory


class OptimizePromptSerializer(serializers.Serializer):

    AI_MODELS = [
        ("gemini", "Gemini"),
        ("ollama", "Ollama"),
    ]

    OPTIMIZATION_LEVELS = [
        ("light", "Light"),
        ("balanced", "Balanced"),
        ("aggressive", "Aggressive"),
    ]

    prompt = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=10000,
    )

    ai_model = serializers.ChoiceField(
        choices=AI_MODELS
    )

    optimization_level = serializers.ChoiceField(
        choices=OPTIMIZATION_LEVELS
    )

    # Validate prompt
    def validate_prompt(self, value):

        value = value.strip()

        if len(value) < 5:
            raise serializers.ValidationError(
                "Prompt must contain at least 5 characters."
            )

        return value

    # Validate complete request
    def validate(self, attrs):

        # Example future validation
        # if attrs["optimization_level"] == "aggressive" and attrs["ai_model"] == "local":
        #     raise serializers.ValidationError(
        #         "Aggressive mode requires an AI model."
        #     )

        return attrs


from rest_framework import serializers
from .models import PromptHistory


class PromptHistorySerializer(serializers.ModelSerializer):

    class Meta:
        model = PromptHistory
        fields = [
            "id",
            "ai_model",
            "optimization_level",
            "original_total_tokens",
            "optimized_total_tokens",
            "tokens_saved",
            "estimated_cost_saved",
            "processing_time",
            "status",
            "created_at",
            "original_prompt",
            "optimized_prompt",
            "original_input_tokens",
            "original_output_tokens",
            "optimized_input_tokens",
            "optimized_output_tokens",
        ]