import time

from ..utils.local_optimizer import optimize_prompt_locally
from ..utils.local_token_count import LocalTokenCounter


class LocalBenchmark:

    def __init__(self):
        self.counter = LocalTokenCounter()

    def compare(self, user_prompt: str):

        start_time = time.perf_counter()

        result = optimize_prompt_locally(user_prompt)

        optimized_prompt = result["optimized_prompt"]

        token_stats = self.counter.compare(
            user_prompt,
            optimized_prompt,
        )

        processing_time = round(
            time.perf_counter() - start_time,
            3,
        )

        return {

            "success": True,

            "status": "completed",

            "provider": "local",

            "model": "Rule-Based Optimizer",

            "original_prompt": user_prompt,

            "optimized_prompt": optimized_prompt,

            # Input Tokens
            "original_input_tokens": token_stats["original_tokens"],
            "optimized_input_tokens": token_stats["optimized_tokens"],

            # Output Tokens (Local Optimizer doesn't generate output)
            "original_output_tokens": 0,
            "optimized_output_tokens": 0,

            # Total Tokens
            "original_total_tokens": token_stats["original_tokens"],
            "optimized_total_tokens": token_stats["optimized_tokens"],

            "tokens_saved": token_stats["tokens_saved"],

            "reduction_percent": token_stats["reduction_percent"],

            "estimated_cost_saved": 0,

            "processing_time": processing_time,

            "optimization_stats": result["stats"],
        }