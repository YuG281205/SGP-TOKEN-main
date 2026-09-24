import time

from dotenv import load_dotenv
from threading import Thread

from ..benchmark.LLMBenchmark import GeminiBenchmark
from ..models import PromptHistory
from ..prompt_builder.builder import PromptBuilder
from ..routers.gemini_routers import GeminiRouter
from .evaluation_services import EvaluationService

from apps.comparison1.services.comparison_service import (
    ComparisonService,
    PromptGeneratorComparisonService,
    NumstackComparisonService,
)

load_dotenv()


class PromptingService:

    def __init__(self):

        self.prompt_builder = PromptBuilder()

        self.gemini_router = GeminiRouter()

        self.gemini_benchmark = GeminiBenchmark()

    # ==========================================================
    # MAIN PROMPTING SERVICE
    # ==========================================================

    def optimize(
        self,
        user,
        prompt,
        optimization_level,
        provider,
    ):

        optimization_level = (
            optimization_level.lower()
        )

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

        return {
            "success": False,
            "message": (
                "Light prompting optimization "
                "is not implemented yet."
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
        #
        # THIS IS THE ONLY THING THAT THE API WAITS FOR
        # ======================================================

        call1_start = time.perf_counter()

        llm_result = (
            self.gemini_router.optimize(
                llm_prompt
            )
        )

        call1_time = (
            time.perf_counter()
            - call1_start
        )

        print(
            f"[TIME] GEMINI PROMPTING CALL: "
            f"{call1_time:.3f}s"
        )

        # ======================================================
        # CHECK GEMINI RESULT
        # ======================================================

        if not llm_result["success"]:

            return {
                "success": False,
                "message": llm_result.get(
                    "error",
                    "Prompt optimization failed.",
                ),
            }

        # ======================================================
        # GET OPTIMIZED PROMPT
        # ======================================================

        final_prompt = (
            llm_result["optimized_prompt"]
        )

        ai_model = (
            llm_result.get(
                "model",
                provider,
            )
        )

        # ======================================================
        # STEP 2
        # START BACKGROUND THREAD
        #
        # EVERYTHING BELOW RUNS AFTER RESPONSE
        # ======================================================

        Thread(
            target=self._background_processing,
            args=(
                user.id,
                prompt,
                final_prompt,
                ai_model,
                total_start,
            ),
            daemon=True,
        ).start()

        # ======================================================
        # STEP 3
        # RETURN OPTIMIZED PROMPT IMMEDIATELY
        # ======================================================

        response_time = (
            time.perf_counter()
            - total_start
        )

        print(
            f"[TIME] PROMPTING RESPONSE: "
            f"{response_time:.3f}s"
        )

        return {

            "success": True,

            "original_prompt": prompt,

            "optimized_prompt": final_prompt,

            "ai_model": ai_model,

            "optimization_level": "balanced",

            "status": "processing",

        }

    # ==========================================================
    # BACKGROUND PROCESSING
    #
    # RUNS ONE BY ONE
    # ==========================================================

    def _background_processing(
        self,
        user_id,
        original_prompt,
        optimized_prompt,
        ai_model,
        total_start,
    ):

        print(
            "[THREAD] Prompting background "
            "processing started"
        )

        try:

            # ==================================================
            # STEP 1
            # ORIGINAL PROMPT BENCHMARK
            # ==================================================

            original_start = (
                time.perf_counter()
            )

            print(
                "[THREAD] Original benchmark started"
            )

            original = (
                self.gemini_benchmark.benchmark(
                    original_prompt
                )
            )

            original_time = (
                time.perf_counter()
                - original_start
            )

            print(
                f"[TIME] Original benchmark: "
                f"{original_time:.3f}s"
            )

            # ==================================================
            # CHECK ORIGINAL
            # ==================================================

            if not original["success"]:

                print(
                    "[THREAD] Original benchmark failed"
                )

                self._save_failed_history(
                    user_id,
                    original_prompt,
                    optimized_prompt,
                    ai_model,
                )

                return

            # ==================================================
            # STEP 2
            # OPTIMIZED PROMPT BENCHMARK
            # ==================================================

            optimized_start = (
                time.perf_counter()
            )

            print(
                "[THREAD] Optimized benchmark started"
            )

            optimized = (
                self.gemini_benchmark.benchmark(
                    optimized_prompt
                )
            )

            optimized_time = (
                time.perf_counter()
                - optimized_start
            )

            print(
                f"[TIME] Optimized benchmark: "
                f"{optimized_time:.3f}s"
            )

            # ==================================================
            # CHECK OPTIMIZED
            # ==================================================

            if not optimized["success"]:

                print(
                    "[THREAD] Optimized benchmark failed"
                )

                self._save_failed_history(
                    user_id,
                    original_prompt,
                    optimized_prompt,
                    ai_model,
                )

                return

            # ==================================================
            # STEP 3
            # SEMANTIC ACCURACY
            # ==================================================

            semantic_start = (
                time.perf_counter()
            )

            print(
                "[THREAD] Semantic accuracy started"
            )

            semantic_accuracy = (
                EvaluationService.semantic_accuracy(
                    original_prompt,
                    optimized_prompt,
                )
            )

            semantic_time = (
                time.perf_counter()
                - semantic_start
            )

            print(
                f"[TIME] Semantic accuracy: "
                f"{semantic_time:.3f}s"
            )

            # ==================================================
            # STEP 4
            # TOKEN CALCULATIONS
            # ==================================================

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

            # ==================================================
            # STEP 5
            # COST CALCULATION
            # ==================================================

            estimated_cost_saved = round(
                tokens_saved * 0.000001,
                6,
            )

            # ==================================================
            # STEP 6
            # OPTIMIZATION SCORE
            # ==================================================

            optimization_score = (
                EvaluationService.optimization_score(
                    original_tokens,
                    tokens_saved,
                )
            )

            # ==================================================
            # STEP 7
            # QUALITY RATING
            # ==================================================

            quality_rating = (
                EvaluationService.quality_rating(
                    semantic_accuracy,
                    optimization_score,
                )
            )

            # ==================================================
            # STEP 8
            # PROCESSING TIME
            # ==================================================

            processing_time = round(
                time.perf_counter()
                - total_start,
                3,
            )

            # ==================================================
            # STEP 9
            # SAVE HISTORY
            # ==================================================

            history = PromptHistory.objects.create(

                user_id=user_id,

                original_prompt=(
                    original_prompt
                ),

                optimized_prompt=(
                    optimized_prompt
                ),

                ai_model=(
                    optimized.get(
                        "model",
                        ai_model,
                    )
                ),

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

                tokens_saved=(
                    tokens_saved
                ),

                estimated_cost_saved=(
                    estimated_cost_saved
                ),

                processing_time=(
                    processing_time
                ),

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

            # ==================================================
            # COMPLETE
            # ==================================================

            total_time = (
                time.perf_counter()
                - total_start
            )

            print(
                f"[TIME] TOTAL PROMPTING "
                f"BACKGROUND: {total_time:.3f}s"
            )

            print(
                f"[THREAD] PromptHistory ID: "
                f"{history.id}"
            )

            # ==================================================
            # COMPARISON THREADS
            #
            # KEEP COMMENTED OUT
            # ==================================================

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

        except Exception as e:

            print(
                f"[THREAD ERROR] "
                f"{str(e)}"
            )

            self._save_failed_history(
                user_id,
                original_prompt,
                optimized_prompt,
                ai_model,
            )

    # ==========================================================
    # SAVE FAILED HISTORY
    # ==========================================================

    def _save_failed_history(
        self,
        user_id,
        original_prompt,
        optimized_prompt,
        ai_model,
    ):

        try:

            PromptHistory.objects.create(

                user_id=user_id,

                original_prompt=(
                    original_prompt
                ),

                optimized_prompt=(
                    optimized_prompt
                ),

                ai_model=ai_model,

                optimization_level="balanced",

                status="failed",
            )

        except Exception as e:

            print(
                f"[DATABASE ERROR] "
                f"{str(e)}"
            )

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
                "Aggressive prompting "
                "is under development."
            ),
        }