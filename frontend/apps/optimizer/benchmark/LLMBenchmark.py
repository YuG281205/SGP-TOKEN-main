import time

from ..routers.gemini_routers import GeminiRouter


class GeminiBenchmark:

    def __init__(self):
        self.router = GeminiRouter()

    def benchmark(
        self,
        prompt: str,
        max_output_tokens: int = 100,
    ) -> dict:
        """
        Benchmark a prompt using Gemini Router.
        The router automatically selects the available Gemini model.
        """

        start_time = time.perf_counter()

        try:

            result = self.router.optimize(prompt)

            latency = round(time.perf_counter() - start_time, 3)

            return {
                "success": True,
                "provider": result["provider"],
                "model": result["model"],
                "response": result["optimized_prompt"],
                "input_tokens": result["usage"]["input_tokens"],
                "output_tokens": result["usage"]["output_tokens"],
                "total_tokens": result["usage"]["total_tokens"],
                "latency_seconds": latency,
                "error": None,
            }

        except Exception as e:

            latency = round(time.perf_counter() - start_time, 3)

            return {
                "success": False,
                "provider": "Gemini",
                "model": "",
                "response": "",
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "latency_seconds": latency,
                "error": str(e),
            }

    def compare(
        self,
        original_prompt: str,
        optimized_prompt: str,
        max_output_tokens: int = 100,
    ) -> dict:
        """
        Compare original and optimized prompts.
        """

        original = self.benchmark(
            prompt=original_prompt,
            max_output_tokens=max_output_tokens,
        )

        if not original["success"]:
            return original

        optimized = self.benchmark(
            prompt=optimized_prompt,
            max_output_tokens=max_output_tokens,
        )

        if not optimized["success"]:
            return optimized

        tokens_saved = (
            original["input_tokens"]
            - optimized["input_tokens"]
        )

        processing_time = round(
            original["latency_seconds"]
            + optimized["latency_seconds"],
            3,
        )

        estimated_cost_saved = round(
            tokens_saved * 0.000001,
            6,
        )

        return {
            "success": True,

            "ai_model": optimized["model"],

            "original_prompt": original_prompt,
            "optimized_prompt": optimized_prompt,

            "original_tokens": original["total_tokens"],
            "optimized_tokens": optimized["total_tokens"],

            "tokens_saved": tokens_saved,

            "estimated_cost_saved": estimated_cost_saved,

            "processing_time": processing_time,

            "status": "completed",

            "original_response": original["response"],
            "optimized_response": optimized["response"],

            "original_input_tokens": original["input_tokens"],
            "original_output_tokens": original["output_tokens"],

            "optimized_input_tokens": optimized["input_tokens"],
            "optimized_output_tokens": optimized["output_tokens"],
        }