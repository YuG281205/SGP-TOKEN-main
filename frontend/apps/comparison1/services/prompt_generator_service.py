import json
import re
import time

from apps.comparison1.playwright.browser import (
    FREE_PROMPT_GENERATOR,
    TIMEOUT,
    SCREENSHOT_DIR,
    LOG_DIR,
)
from apps.comparison1.playwright.manager import BrowserManager1
from apps.comparison1.playwright.lock import browser_lock

class PromptGeneratorService:

    @staticmethod
    def optimize(
        prompt: str,
        screenshot_name: str = "after_optimize.png",
    ) -> str:
        with browser_lock:
            manager = BrowserManager1()
            context = manager.start()
            page = context.new_page()

            try:
                page.goto(
                    FREE_PROMPT_GENERATOR,
                    wait_until="domcontentloaded",
                    timeout=TIMEOUT,
                )

                PromptGeneratorService._fill_prompt(page, prompt)

                optimized_prompt = PromptGeneratorService._get_result_text(
                    page,
                    timeout_ms=60000,
                )

                page.wait_for_timeout(500)

                screenshot_path = SCREENSHOT_DIR / screenshot_name
                page.screenshot(
                    path=str(screenshot_path),
                    full_page=True,
                )

                log_file = LOG_DIR / "prompt_generator_optimized_prompt.txt"
                log_file.write_text(
                    optimized_prompt or "",
                    encoding="utf-8",
                )

                return optimized_prompt

            finally:
                manager.stop()

    @staticmethod
    def _fill_prompt(page, prompt):

        prompt_box = page.get_by_role(
            "textbox",
            name=re.compile(
                "Enter your prompt to optimize",
                re.IGNORECASE,
            ),
        )

        prompt_box.wait_for(
            state="visible",
            timeout=TIMEOUT,
        )

        prompt_box.scroll_into_view_if_needed()

        prompt_box.fill(prompt)

        # PromptOpt submits on Enter
        prompt_box.press("Enter")

    @staticmethod
    def _get_result_text(
        page,
        timeout_ms=60000,
        stable_checks=3,
        poll_interval_ms=500,
    ):
        # IMPORTANT: scope to .first — if the page has more than one element
        # matching this CSS selector (e.g. the original prompt is rendered
        # with the same classes as the optimized result), calling
        # .inner_text() on an un-scoped locator throws a Playwright strict-mode
        # error on every single poll. That error was being swallowed below,
        # so the loop would spin silently and never populate last_value.
        result = page.locator(
            "p.text-gray-800.text-sm.leading-relaxed"
        ).first

        result.wait_for(
            state="visible",
            timeout=timeout_ms,
        )

        start = time.time()
        last_value = None
        last_seen_value = ""  # tracks any non-empty text, even without ```json
        stable_count = 0

        while (time.time() - start) * 1000 < timeout_ms:

            try:
                value = result.inner_text().strip()
            except Exception as e:
                # Log instead of silently swallowing, so failures are visible
                print(f"[_get_result_text] inner_text() failed: {e!r}")
                value = ""

            if value:
                last_seen_value = value

            # Original code required "```json" to be present before it would
            # ever consider the value stable. If the site doesn't always wrap
            # the result in a code fence, last_value stayed None forever and
            # you'd get a timeout with no useful text at all.
            if value:
                if value == last_value:
                    stable_count += 1
                    if stable_count >= stable_checks:
                        break
                else:
                    stable_count = 0
                    last_value = value

            page.wait_for_timeout(poll_interval_ms)

        # Fall back to whatever text we last saw, even if it never "stabilized"
        final_value = last_value or last_seen_value

        if not final_value:
            raise TimeoutError(
                f"Optimized prompt did not populate within {timeout_ms}ms"
            )

        text = final_value.strip()

        if text.startswith("```json"):
            text = text[len("```json"):].strip()

        if text.endswith("```"):
            text = text[:-3].strip()

        try:
            data = json.loads(text)
            return data["optimized"]["openai"]
        except Exception as e:
            print(f"[_get_result_text] JSON parse failed, returning raw text: {e!r}")
            return text