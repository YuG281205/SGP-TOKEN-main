import re
import time

from apps.comparison1.playwright.browser import (
    NUMSTACK_URL,
    TIMEOUT,
    SCREENSHOT_DIR,
    LOG_DIR,
)
from apps.comparison1.playwright.manager import BrowserManager2
from apps.comparison1.playwright.lock import browser_lock

class NumstackService:
    """
    Automates https://numstack.net/calculators/prompt-optimizer

    Unlike AivenService/PromptnatusService, this page produces THREE
    optimized variants at once (Remove Redundancy / Restructure for
    Clarity / Simplify Language), each behind its own "Copy optimized
    prompt from <Strategy>" button - there's no single editor to read
    a final value from. So optimize() returns a dict of all three by
    default; pass `variant` if you only want one (for compatibility
    with callers like ComparisonService that expect a single string).
    """

    DEFAULT_MODEL = "gemini-2.5-pro"  # matches the value used in your codegen recording

    @staticmethod
    def optimize(
        prompt: str,
        model: str = DEFAULT_MODEL,
        variant: str | None = None,
        screenshot_name: str = "after_optimize.png",
    ):
        with browser_lock:
            print("LOCK ACQUIRED")
            manager = BrowserManager2()
            context = manager.start()

            # Needed so we can read back what gets "copied" to the clipboard
            # instead of scraping fragile, unknown result-card DOM structure.
            context.grant_permissions(["clipboard-read", "clipboard-write"])

            page = context.new_page()

            try:
                page.goto(
                    NUMSTACK_URL,
                    wait_until="domcontentloaded",
                    timeout=TIMEOUT,
                )

                NumstackService._fill_prompt(page, prompt)
                NumstackService._select_model(page, model)

                optimize_button = page.get_by_role(
                    "button",
                    name=re.compile(r"Optimize Prompt", re.IGNORECASE),
                )
                optimize_button.click()

                variants = NumstackService._read_all_variants(page, timeout_ms=30000)

                page.wait_for_timeout(500)

                screenshot_path = SCREENSHOT_DIR / screenshot_name
                page.screenshot(path=str(screenshot_path), full_page=True)

                log_file = LOG_DIR / "numstack_optimized_prompt.txt"
                log_file.write_text(
                    "\n\n".join(f"[{name}]\n{text}" for name, text in variants.items()),
                    encoding="utf-8",
                )

                if variant is not None:
                    return variants.get(variant, "")

                return variants

            finally:
                manager.stop()

    @staticmethod
    def _fill_prompt(page, prompt):
        prompt_box = page.get_by_role(
            "textbox",
            name=re.compile("Paste your prompt", re.IGNORECASE),
        )
        prompt_box.wait_for(state="visible", timeout=TIMEOUT)
        prompt_box.click()
        prompt_box.fill(prompt)

    @staticmethod
    def _select_model(page, model):
        page.get_by_label(
            re.compile("Model", re.IGNORECASE)
        ).select_option(model)

    @staticmethod
    def _read_all_variants(page, timeout_ms=30000, poll_interval_ms=400):
        """
        Waits for all 3 "Copy optimized prompt from <Strategy>" buttons
        to render, then clicks each one and reads the clipboard - which
        is what actually gets written to the clipboard, so this reads
        exactly what a human clicking "Copy" would get, rather than
        guessing at result-card markup that may change.
        """
        copy_button_pattern = re.compile(
            r"Copy optimized prompt from (.+)", re.IGNORECASE
        )

        start = time.time()
        buttons = []

        while (time.time() - start) * 1000 < timeout_ms:
            buttons = page.get_by_role(
                "button",
                name=copy_button_pattern,
            ).all()
            if len(buttons) >= 3:
                break
            page.wait_for_timeout(poll_interval_ms)

        variants = {}

        for button in buttons:
            accessible_name = button.get_attribute("aria-label") or button.inner_text()
            match = copy_button_pattern.search(accessible_name)
            strategy_name = match.group(1).strip() if match else accessible_name.strip()

            button.click()

            clipboard_text = page.evaluate("() => navigator.clipboard.readText()")
            variants[strategy_name] = (clipboard_text or "").strip()

        return variants

