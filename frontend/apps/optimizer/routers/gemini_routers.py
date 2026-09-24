from ..config import GEMINI_MODELS

from ..adapters.gemini_adapter import (
    GeminiAdapter,
    GeminiRateLimitError,
    GeminiModelNotFoundError,
    GeminiAuthenticationError,
)


class GeminiRouter:
    """
    Routes Gemini requests across multiple models.

    Order:
    1. Flash Lite
    2. Flash
    3. Pro

    If a model hits quota/rate limit or is unavailable,
    automatically tries the next model.
    """

    def __init__(self):
        self.adapter = GeminiAdapter()

    def optimize(self, prompt: str):

        last_exception = None

        for model in GEMINI_MODELS:

            print(f"\nTrying model: {model}")

            try:

                result = self.adapter.optimize(
                    prompt=prompt,
                    model=model,
                )

                print(f"SUCCESS: {model}")

                return result

            except GeminiModelNotFoundError as e:

                print(f"NOT FOUND: {e}")

                last_exception = e
                continue

            except GeminiRateLimitError as e:

                print(f"RATE LIMIT: {e}")

                last_exception = e
                continue

            except GeminiAuthenticationError as e:

                print(f"AUTH ERROR: {e}")

                raise

            except Exception as e:

                print(f"UNKNOWN ERROR: {e}")

                last_exception = e
                continue

        raise Exception(
            f"All Gemini models are unavailable. "
            f"Last Error: {last_exception}"
        )