from ..utils.semantic_similarity import (
    calculate_semantic_accuracy
)


class EvaluationService:


    @staticmethod
    def optimization_score(
        original_tokens,
        saved_tokens
    ):

        if original_tokens == 0:
            return 0

        return round(
            (saved_tokens / original_tokens) * 100,
            2
        )


    @staticmethod
    def semantic_accuracy(
        original_prompt,
        optimized_prompt
    ):

        return calculate_semantic_accuracy(
            original_prompt,
            optimized_prompt
        )


    @staticmethod
    def quality_rating(
        semantic_accuracy,
        optimization_score
    ):

        if (
            semantic_accuracy >= 95
            and
            optimization_score >= 20
        ):

            return "Excellent"


        if (
            semantic_accuracy >= 90
            and
            optimization_score >= 15
        ):

            return "Very Good"


        if semantic_accuracy >= 85:

            return "Good"


        return "Needs Improvement"