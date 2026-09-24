import os
import time

from dotenv import load_dotenv
from threading import Thread
from concurrent.futures import ThreadPoolExecutor

from ..benchmark.local_benchmark import LocalBenchmark
from ..benchmark.LLMBenchmark import GeminiBenchmark
from ..prompt_builder.builder import PromptBuilder
from ..models import PromptHistory
from ..routers.gemini_routers import GeminiRouter
from .evaluation_services import EvaluationService

from apps.comparison1.services.comparison_service import (
    ComparisonService,
    PromptGeneratorComparisonService,
    NumstackComparisonService,
)

load_dotenv()


class OptimizerService:

    def __init__(self):

        self.local_benchmark = LocalBenchmark()

        self.prompt_builder = PromptBuilder()

        self.gemini_router = GeminiRouter()

        self.gemini_benchmark = GeminiBenchmark()

    # ==========================================================
    # MAIN OPTIMIZER
    # ==========================================================

    def optimize(
        self,
        user,
        prompt,
        optimization_level,
        provider,
    ):

        optimization_level = optimization_level.lower()

        provider = provider.lower()

        if optimization_level == "light":

            return self._light_pipeline(
                user,
                prompt,
                provider,
            )

        elif optimization_level == "balanced":

            return self._balanced_pipeline(
                user,
                prompt,
                provider,
            )

        elif optimization_level == "aggressive":

            return self._aggressive_pipeline(
                user,
                prompt,
                provider,
            )

        return {
            "success": False,
            "message": "Invalid optimization level.",
        }

    # ==========================================================
    # LIGHT PIPELINE
    # ==========================================================

    def _light_pipeline(
        self,
        user,
        prompt,
        provider,
    ):

        result = self.local_benchmark.compare(
            prompt
        )

        # -----------------------------------------
        # AI Evaluation
        # -----------------------------------------

        semantic_accuracy = (
            EvaluationService.semantic_accuracy(
                result["original_prompt"],
                result["optimized_prompt"],
            )
        )

        optimization_score = (
            EvaluationService.optimization_score(
                result["original_total_tokens"],
                result["tokens_saved"],
            )
        )

        quality_rating = (
            EvaluationService.quality_rating(
                semantic_accuracy,
                optimization_score,
            )
        )

        # -----------------------------------------
        # Save History
        # -----------------------------------------

        history = PromptHistory.objects.create(

            user=user,

            original_prompt=(
                result["original_prompt"]
            ),

            optimized_prompt=(
                result["optimized_prompt"]
            ),

            ai_model=provider,

            optimization_level="light",

            original_input_tokens=(
                result["original_input_tokens"]
            ),

            original_output_tokens=(
                result["original_output_tokens"]
            ),

            optimized_input_tokens=(
                result["optimized_input_tokens"]
            ),

            optimized_output_tokens=(
                result["optimized_output_tokens"]
            ),

            original_total_tokens=(
                result["original_total_tokens"]
            ),

            optimized_total_tokens=(
                result["optimized_total_tokens"]
            ),

            tokens_saved=(
                result["tokens_saved"]
            ),

            estimated_cost_saved=(
                result["estimated_cost_saved"]
            ),

            processing_time=(
                result["processing_time"]
            ),

            status=result["status"],

            semantic_accuracy=(
                semantic_accuracy
            ),

            optimization_score=(
                optimization_score
            ),

            quality_rating=(
                quality_rating
            ),
        )

        return {

            "success": True,

            "history_id": history.id,

            **result,

            "semantic_accuracy": (
                semantic_accuracy
            ),

            "optimization_score": (
                optimization_score
            ),

            "quality_rating": (
                quality_rating
            ),
        }

    # ==========================================================
    # BALANCED PIPELINE
    # ==========================================================

    def _balanced_pipeline(
    self,
    user,
    prompt,
    provider,
):

        total_start = time.perf_counter()

        # ======================================================
        # STEP 1
        # BUILD PROMPT
        # ======================================================

        llm_prompt = (
            self.prompt_builder.build_balanced_prompt(
                prompt
            )
        )

        # ======================================================
        # CALL #1
        # GEMINI OPTIMIZATION
        # ======================================================

        call1_start = time.perf_counter()

        llm_result = (
            self.gemini_router.optimize(
                llm_prompt
            )
        )

        print(
            f"[TIME] GEMINI CALL #1: "
            f"{time.perf_counter() - call1_start:.3f}s"
        )

        if not llm_result["success"]:

            return {
                "success": False,
                "message": llm_result.get(
                    "error",
                    "Optimization failed.",
                ),
            }

        final_prompt = (
            llm_result["optimized_prompt"]
        )

        # ======================================================
        # CALL #2 + CALL #3 + SEMANTIC ACCURACY
        #
        # ALL THREE START TOGETHER
        # ======================================================

        parallel_start = time.perf_counter()

        with ThreadPoolExecutor(
            max_workers=3
        ) as executor:

            # --------------------------------------------------
            # CALL #2
            # ORIGINAL PROMPT
            # --------------------------------------------------

            original_future = executor.submit(
                self.gemini_benchmark.benchmark,
                prompt,
            )

            # --------------------------------------------------
            # CALL #3
            # OPTIMIZED PROMPT
            # --------------------------------------------------

            optimized_future = executor.submit(
                self.gemini_benchmark.benchmark,
                final_prompt,
            )

            # --------------------------------------------------
            # SEMANTIC ACCURACY
            #
            # Does NOT depend on Call #2/#3.
            # It only needs the two prompts.
            # --------------------------------------------------

            semantic_future = executor.submit(
                EvaluationService.semantic_accuracy,
                prompt,
                final_prompt,
            )

            # --------------------------------------------------
            # WAIT FOR ALL
            # --------------------------------------------------

            original = original_future.result()

            optimized = optimized_future.result()

            semantic_accuracy = semantic_future.result()

        parallel_time = (
            time.perf_counter()
            - parallel_start
        )

        print(
            f"[TIME] CALL #2 + #3 + SEMANTIC: "
            f"{parallel_time:.3f}s"
        )

        # ======================================================
        # CHECK ORIGINAL
        # ======================================================

        if not original["success"]:

            return {
                "success": False,
                "message": original.get(
                    "error",
                    "Original prompt benchmark failed.",
                ),
            }

        # ======================================================
        # CHECK OPTIMIZED
        # ======================================================

        if not optimized["success"]:

            return {
                "success": False,
                "message": optimized.get(
                    "error",
                    "Optimized prompt benchmark failed.",
                ),
            }

        # ======================================================
        # TOKEN CALCULATIONS
        # ======================================================

        original_tokens = (
            original["total_tokens"]
        )

        optimized_tokens = (
            optimized["total_tokens"]
        )

        tokens_saved = (
            original["input_tokens"]
            - optimized["input_tokens"]
        )

        # ======================================================
        # COST
        # ======================================================

        estimated_cost_saved = round(
            tokens_saved * 0.000001,
            6,
        )

        # ======================================================
        # OPTIMIZATION SCORE
        # ======================================================

        optimization_score = (
            EvaluationService.optimization_score(
                original_tokens,
                tokens_saved,
            )
        )

        # ======================================================
        # QUALITY
        # ======================================================

        quality_rating = (
            EvaluationService.quality_rating(
                semantic_accuracy,
                optimization_score,
            )
        )

        # ======================================================
        # PROCESSING TIME
        # ======================================================

        processing_time = round(
            time.perf_counter()
            - total_start,
            3,
        )

        # ======================================================
        # SAVE HISTORY
        # ======================================================

        history = PromptHistory.objects.create(

            user=user,

            original_prompt=prompt,

            optimized_prompt=final_prompt,

            ai_model=optimized["model"],

            optimization_level="balanced",

            original_input_tokens=(
                original["input_tokens"]
            ),

            original_output_tokens=(
                original["output_tokens"]
            ),

            optimized_input_tokens=(
                optimized["input_tokens"]
            ),

            optimized_output_tokens=(
                optimized["output_tokens"]
            ),

            original_total_tokens=(
                original_tokens
            ),

            optimized_total_tokens=(
                optimized_tokens
            ),

            tokens_saved=tokens_saved,

            estimated_cost_saved=(
                estimated_cost_saved
            ),

            processing_time=processing_time,

            status="completed",

            semantic_accuracy=(
                semantic_accuracy
            ),

            optimization_score=(
                optimization_score
            ),

            quality_rating=(
                quality_rating
            ),
        )

        # ======================================================
        # COMPARISON THREADS
        #
        # KEEP COMMENTED OUT
        # ======================================================

        # Thread(
        #     target=ComparisonService.compare,
        #     args=(history.id,),
        #     daemon=True,
        # ).start()

        # Thread(
        #     target=PromptGeneratorComparisonService.compare,
        #     args=(history.id,),
        #     daemon=True,
        # ).start()

        # Thread(
        #     target=NumstackComparisonService.compare,
        #     args=(history.id,),
        #     daemon=True,
        # ).start()

        # ======================================================
        # TOTAL TIME
        # ======================================================

        total_time = (
            time.perf_counter()
            - total_start
        )

        print(
            f"[TIME] TOTAL OPTIMIZATION: "
            f"{total_time:.3f}s"
        )

        # ======================================================
        # SAME RESPONSE AS BEFORE
        # ======================================================

        return {

            "success": True,

            "history_id": history.id,

            "original_prompt": prompt,

            "optimized_prompt": final_prompt,

            "ai_model": optimized["model"],

            "original_tokens": original_tokens,

            "optimized_tokens": optimized_tokens,

            "tokens_saved": tokens_saved,

            "estimated_cost_saved": (
                estimated_cost_saved
            ),

            "processing_time": processing_time,

            "status": "completed",

            "original_response": (
                original["response"]
            ),

            "optimized_response": (
                optimized["response"]
            ),

            "original_input_tokens": (
                original["input_tokens"]
            ),

            "original_output_tokens": (
                original["output_tokens"]
            ),

            "optimized_input_tokens": (
                optimized["input_tokens"]
            ),

            "optimized_output_tokens": (
                optimized["output_tokens"]
            ),

            "semantic_accuracy": (
                semantic_accuracy
            ),

            "optimization_score": (
                optimization_score
            ),

            "quality_rating": (
                quality_rating
            ),
        }

    # ==========================================================
    # AGGRESSIVE PIPELINE
    # ==========================================================

    def _aggressive_pipeline(
        self,
        user,
        prompt,
        provider,
    ):

        return {
            "success": False,
            "message": (
                "Aggressive pipeline is under development."
            ),
        }