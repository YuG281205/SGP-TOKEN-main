"""
Local Token Counter

Uses tiktoken to estimate token counts without making
any API requests.

Supported:
- GPT models (exact)
- Gemini / Ollama (approximation)
"""

import tiktoken


class LocalTokenCounter:

    def __init__(self, encoding_name: str = "cl100k_base"):
        """
        Initialize tokenizer.

        cl100k_base is compatible with GPT-4, GPT-4o and
        provides a good approximation for other LLMs.
        """

        self.encoding = tiktoken.get_encoding(encoding_name)

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in a string.
        """

        if not text:
            return 0

        return len(self.encoding.encode(text))

    def compare(
        self,
        original_text: str,
        optimized_text: str,
    ) -> dict:
        """
        Compare original and optimized prompts.
        """

        original_tokens = self.count_tokens(original_text)

        optimized_tokens = self.count_tokens(optimized_text)

        tokens_saved = original_tokens - optimized_tokens

        reduction_percent = 0.0

        if original_tokens > 0:
            reduction_percent = round(
                (tokens_saved / original_tokens) * 100,
                2,
            )

        return {

            "original_tokens": original_tokens,

            "optimized_tokens": optimized_tokens,

            "tokens_saved": tokens_saved,

            "reduction_percent": reduction_percent,
        }