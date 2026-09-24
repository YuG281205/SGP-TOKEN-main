import os
import time

from dotenv import load_dotenv
from google import genai

from .base_adapter import BaseLLMAdapter

load_dotenv()


class GeminiRateLimitError(Exception):
    """Raised when Gemini quota is exhausted or service is temporarily unavailable."""
    pass


class GeminiModelNotFoundError(Exception):
    """Raised when the requested Gemini model is unavailable."""
    pass


class GeminiAuthenticationError(Exception):
    """Raised when API key is invalid or access is denied."""
    pass


class GeminiAdapter(BaseLLMAdapter):
    """
    Gemini Adapter

    Responsible only for communicating with Gemini API.
    """

    def __init__(self):

        self.api_key = os.getenv("GEMINI_API_KEY")

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found.")

        self.client = genai.Client(api_key=self.api_key)

    def optimize(self, prompt: str, model: str) -> dict:

        start_time = time.perf_counter()

        try:

            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
            )

            latency = round(time.perf_counter() - start_time, 3)

            usage = response.usage_metadata

            return {

                "success": True,

                "provider": "Gemini",

                "model": model,

                "optimized_prompt": response.text.strip(),

                "usage": {

                    "input_tokens": usage.prompt_token_count,

                    "output_tokens": usage.candidates_token_count,

                    "total_tokens": usage.total_token_count,
                },

                "execution_time": latency,

                "error": None,
            }

        except Exception as e:

            latency = round(time.perf_counter() - start_time, 3)

            error = str(e).lower()

            print("\n" + "=" * 60)
            print("GEMINI API ERROR")
            print("=" * 60)
            print(type(e))
            print(str(e))
            print("=" * 60 + "\n")

            # -----------------------------
            # 404 - Model not available
            # -----------------------------
            if (
                "404" in error
                or "not_found" in error
                or "no longer available" in error
            ):
                raise GeminiModelNotFoundError(
                    f"{model} is not available."
                ) from e

            # -----------------------------
            # 429 - Quota exhausted
            # -----------------------------
            if (
                "429" in error
                or "resource_exhausted" in error
                or "quota" in error
                or "rate limit" in error
            ):
                raise GeminiRateLimitError(
                    f"{model} quota exhausted."
                ) from e

            # -----------------------------
            # 503 - High demand
            # -----------------------------
            if (
                "503" in error
                or "unavailable" in error
                or "high demand" in error
            ):
                raise GeminiRateLimitError(
                    f"{model} temporarily unavailable."
                ) from e

            # -----------------------------
            # Authentication / Permission
            # -----------------------------
            if (
                "401" in error
                or "403" in error
                or "permission_denied" in error
                or "unauthenticated" in error
            ):
                raise GeminiAuthenticationError(
                    "Gemini authentication failed."
                ) from e

            # Unknown error
            raise