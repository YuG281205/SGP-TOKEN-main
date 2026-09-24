from uuid import uuid4

from apps.optimizer.models import PromptHistory
from apps.optimizer.benchmark.LLMBenchmark import GeminiBenchmark
from apps.comparison1.models import ComparisonHistory
from apps.comparison1.services.aiven_service import AivenService
from apps.comparison1.services.numstack_service import NumstackService
from apps.comparison1.services.prompt_generator_service import PromptGeneratorService
from apps.optimizer.utils.semantic_similarity import (
    calculate_semantic_accuracy,
)


class ComparisonService:

    @staticmethod
    def token_reduction_score(original_tokens, saved_tokens):

        if original_tokens == 0:
            return 0

        return round(
            (saved_tokens / original_tokens) * 100,
            2
        )

    @staticmethod
    def compare(history_id):

        history = PromptHistory.objects.get(
            id=history_id,
        )

        # Generate unique screenshot filename
        filename = f"{uuid4().hex}.png"

        # Optimize using Aiven
        aiven_optimized_prompt = AivenService.optimize(
            history.original_prompt,
            screenshot_name=filename,
        )

        # Benchmark using Gemini
        benchmark = GeminiBenchmark()

        benchmark_result = benchmark.compare(
            original_prompt=history.original_prompt,
            optimized_prompt=aiven_optimized_prompt,
        )

        if not benchmark_result["success"]:

            comparison = ComparisonHistory.objects.create(
                history=history,
                optimizer_name="aiven",
                optimized_prompt=aiven_optimized_prompt,
                optimized_prompt_image=f"comparison_images/{filename}",
                status="failed",
                error_message=benchmark_result["error"],
            )

            return comparison

        # Semantic accuracy
        semantic_accuracy = calculate_semantic_accuracy(
            history.original_prompt,
            aiven_optimized_prompt,
        )

        # Token reduction score
        optimization_score = ComparisonService.token_reduction_score(
            benchmark_result["original_tokens"],
            benchmark_result["tokens_saved"],
        )

        comparison = ComparisonHistory.objects.create(
            history=history,
            optimizer_name="aiven",
            optimized_prompt=aiven_optimized_prompt,
            optimized_input_tokens=benchmark_result[
                "optimized_input_tokens"
            ],
            optimized_output_tokens=benchmark_result[
                "optimized_output_tokens"
            ],
            optimized_total_tokens=benchmark_result[
                "optimized_tokens"
            ],
            tokens_saved=benchmark_result[
                "tokens_saved"
            ],
            semantic_accuracy=semantic_accuracy,
            optimization_score=optimization_score,
            estimated_cost_saved=benchmark_result[
                "estimated_cost_saved"
            ],
            processing_time=benchmark_result[
                "processing_time"
            ],
            optimized_prompt_image=f"comparison_images/{filename}",
            status="completed",
        )

        return comparison


class PromptGeneratorComparisonService:

    @staticmethod
    def token_reduction_score(original_tokens, saved_tokens):

        if original_tokens == 0:
            return 0

        return round(
            (saved_tokens / original_tokens) * 100,
            2
        )

    @staticmethod
    def compare(history_id):

        history = PromptHistory.objects.get(
            id=history_id,
        )

        # Generate unique screenshot filename
        filename = f"{uuid4().hex}.png"

        # Optimize using the free Prompt Generator
        prompt_generator_optimized_prompt = PromptGeneratorService.optimize(
            history.original_prompt,
            screenshot_name=filename,
        )

        # Benchmark using Gemini
        benchmark = GeminiBenchmark()

        benchmark_result = benchmark.compare(
            original_prompt=history.original_prompt,
            optimized_prompt=prompt_generator_optimized_prompt,
        )

        if not benchmark_result["success"]:

            comparison = ComparisonHistory.objects.create(
                history=history,
                optimizer_name="prompt-opt",
                optimized_prompt=prompt_generator_optimized_prompt,
                optimized_prompt_image=f"comparison_images/{filename}",
                status="failed",
                error_message=benchmark_result["error"],
            )

            return comparison

        # Semantic accuracy
        semantic_accuracy = calculate_semantic_accuracy(
            history.original_prompt,
            prompt_generator_optimized_prompt,
        )

        # Token reduction score
        optimization_score = PromptGeneratorComparisonService.token_reduction_score(
            benchmark_result["original_tokens"],
            benchmark_result["tokens_saved"],
        )

        comparison = ComparisonHistory.objects.create(
            history=history,
            optimizer_name="prompt_generator",
            optimized_prompt=prompt_generator_optimized_prompt,
            optimized_input_tokens=benchmark_result[
                "optimized_input_tokens"
            ],
            optimized_output_tokens=benchmark_result[
                "optimized_output_tokens"
            ],
            optimized_total_tokens=benchmark_result[
                "optimized_tokens"
            ],
            tokens_saved=benchmark_result[
                "tokens_saved"
            ],
            semantic_accuracy=semantic_accuracy,
            optimization_score=optimization_score,
            estimated_cost_saved=benchmark_result[
                "estimated_cost_saved"
            ],
            processing_time=benchmark_result[
                "processing_time"
            ],
            optimized_prompt_image=f"comparison_images/{filename}",
            status="completed",
        )

        return comparison


class NumstackComparisonService:
    """
    Unlike ComparisonService/PromptnatusComparisonService, NumstackService
    returns THREE optimized variants per call (Remove Redundancy /
    Restructure for Clarity / Simplify Language) instead of one string.
    So compare() benchmarks and stores all three as separate
    ComparisonHistory rows in a single call, rather than one row per
    call like the other two services.
    """

    @staticmethod
    def token_reduction_score(original_tokens, saved_tokens):

        if original_tokens == 0:
            return 0

        return round(
            (saved_tokens / original_tokens) * 100,
            2
        )

    @staticmethod
    def compare(history_id):

        history = PromptHistory.objects.get(
            id=history_id,
        )

        # Generate unique screenshot filename (shared across all 3
        # variants since they all come from one page load/screenshot)
        filename = f"{uuid4().hex}.png"

        # Optimize using Numstack - returns a dict of 3 variants,
        # e.g. {"Remove Redundancy": "...", "Restructure for Clarity": "...", ...}
        numstack_variants = NumstackService.optimize(
            history.original_prompt,
            screenshot_name=filename,
        )

        benchmark = GeminiBenchmark()
        comparisons = []

        for strategy_name, optimized_prompt in numstack_variants.items():

            optimizer_name = NumstackComparisonService._optimizer_name_for(
                strategy_name
            )

            comparisons.append(
                NumstackComparisonService._compare_single_variant(
                    history=history,
                    benchmark=benchmark,
                    optimizer_name=optimizer_name,
                    optimized_prompt=optimized_prompt,
                    filename=filename,
                )
            )

        return comparisons

    @staticmethod
    def _optimizer_name_for(strategy_name):
        """
        Turns a strategy label like "Remove Redundancy" into a stable,
        DB-friendly optimizer_name like "numstack_remove_redundancy",
        so each variant is distinguishable in ComparisonHistory without
        depending on the site's exact display text staying identical.
        """
        slug = "_".join(strategy_name.lower().split())
        return f"numstack_{slug}"

    @staticmethod
    def _compare_single_variant(
        history,
        benchmark,
        optimizer_name,
        optimized_prompt,
        filename,
    ):

        if not optimized_prompt:
            return ComparisonHistory.objects.create(
                history=history,
                optimizer_name=optimizer_name,
                optimized_prompt=optimized_prompt,
                optimized_prompt_image=f"comparison_images/{filename}",
                status="failed",
                error_message="Numstack returned an empty result for this variant.",
            )

        benchmark_result = benchmark.compare(
            original_prompt=history.original_prompt,
            optimized_prompt=optimized_prompt,
        )

        if not benchmark_result["success"]:

            return ComparisonHistory.objects.create(
                history=history,
                optimizer_name=optimizer_name,
                optimized_prompt=optimized_prompt,
                optimized_prompt_image=f"comparison_images/{filename}",
                status="failed",
                error_message=benchmark_result["error"],
            )

        # Semantic accuracy
        semantic_accuracy = calculate_semantic_accuracy(
            history.original_prompt,
            optimized_prompt,
        )

        # Token reduction score
        optimization_score = NumstackComparisonService.token_reduction_score(
            benchmark_result["original_tokens"],
            benchmark_result["tokens_saved"],
        )

        return ComparisonHistory.objects.create(
            history=history,
            optimizer_name=optimizer_name,
            optimized_prompt=optimized_prompt,
            optimized_input_tokens=benchmark_result[
                "optimized_input_tokens"
            ],
            optimized_output_tokens=benchmark_result[
                "optimized_output_tokens"
            ],
            optimized_total_tokens=benchmark_result[
                "optimized_tokens"
            ],
            tokens_saved=benchmark_result[
                "tokens_saved"
            ],
            semantic_accuracy=semantic_accuracy,
            optimization_score=optimization_score,
            estimated_cost_saved=benchmark_result[
                "estimated_cost_saved"
            ],
            processing_time=benchmark_result[
                "processing_time"
            ],
            optimized_prompt_image=f"comparison_images/{filename}",
            status="completed",
        )