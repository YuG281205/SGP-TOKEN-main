import re
import time

from apps.comparison1.playwright.browser import (
    AIVEN_URL,
    TIMEOUT,
    SCREENSHOT_DIR,
    LOG_DIR,
)
from apps.comparison1.playwright.manager import BrowserManager
from apps.comparison1.playwright.lock import browser_lock

class AivenService:

    @staticmethod
    def optimize(
        prompt: str,
        screenshot_name: str = "after_optimize.png",
    ) -> str:
        with browser_lock:
            print("LOCK ACQUIRED...")
            manager = BrowserManager()
            context = manager.start()
            page = context.new_page()

            try:
                page.goto(
                    AIVEN_URL,
                    wait_until="domcontentloaded",
                    timeout=TIMEOUT,
                )

                AivenService._dismiss_cookie_banner(page)
                AivenService._type_into_monaco(page, prompt)

                optimize_button = page.get_by_role(
                    "button",
                    name=re.compile("Optimize prompt", re.IGNORECASE),
                )

                optimize_button.click()

                # Wait for the button to enter a "working" state and then
                # come back — this is a real completion signal instead of
                # guessing from rendered text.
                AivenService._wait_for_button_idle(page, optimize_button)

                optimized_prompt = AivenService._get_full_editor_text(
                    page,
                    editor_index=-1,
                    timeout_ms=30000,
                )

                page.wait_for_timeout(500)

                screenshot_path = SCREENSHOT_DIR / screenshot_name
                page.screenshot(path=str(screenshot_path), full_page=True)

                log_file = LOG_DIR / "optimized_prompt.txt"
                log_file.write_text(optimized_prompt, encoding="utf-8")

                return optimized_prompt

            finally:
                manager.stop()

    @staticmethod
    def _dismiss_cookie_banner(page):
        try:
            accept_button = page.get_by_role(
                "button",
                name=re.compile("Accept", re.IGNORECASE),
            )
            accept_button.wait_for(state="visible", timeout=5000)
            accept_button.click()
        except Exception:
            pass

    @staticmethod
    def _type_into_monaco(page, prompt):
        """
        Sets the prompt directly on the Monaco editor's model instead of
        simulating keystrokes. Playwright's keyboard.type() dispatches one
        event per character, and Monaco often re-runs syntax highlighting
        and layout on every keystroke — for long prompts this can take
        several seconds. Writing straight to the model via setValue() is
        effectively an instant "paste" and skips that overhead entirely.

        setValue() still fires Monaco's onDidChangeModelContent event, so
        most React/Vue bindings that listen for content changes (e.g. to
        enable the Optimize button) will still pick it up correctly.
        """
        page.wait_for_selector(".monaco-editor", state="visible", timeout=TIMEOUT)
        editor = page.locator(".monaco-editor").first
        editor.click()

        set_directly = page.evaluate(
            """(text) => {
                if (!window.monaco || !window.monaco.editor) return false;
                const models = window.monaco.editor.getModels();
                if (!models || models.length === 0) return false;

                // Prefer the model that looks like the empty input editor
                // (safer than hardcoding index 0 if ordering isn't guaranteed).
                let model = models.find(
                    (m) => !m.getValue() || m.getValue().trim().length === 0
                );
                if (!model) model = models[0];

                model.setValue(text);
                return true;
            }""",
            prompt,
        )

        if not set_directly:
            # Fallback: Monaco global API not exposed on this page —
            # use insert_text, which pastes the whole string as one
            # operation instead of dispatching per-character key events.
            page.keyboard.press("Control+A")
            page.keyboard.press("Delete")
            page.keyboard.insert_text(prompt)

    @staticmethod
    def _wait_for_button_idle(page, button, timeout_ms=30000):
        """
        Waits for the Optimize button to reflect a loading state and then
        return to idle. Falls back gracefully if no such state exists,
        so this never hard-fails the whole flow.
        """
        try:
            # Common patterns: aria-busy, disabled attribute, or a spinner
            # element inside the button. Adjust selector if you inspect
            # the actual DOM and find a more specific loading indicator.
            page.wait_for_function(
                """(btn) => {
                    return btn.disabled === true
                        || btn.getAttribute('aria-busy') === 'true'
                        || btn.querySelector('.spinner, .loading, [class*="loading"]') !== null;
                }""",
                arg=button.element_handle(),
                timeout=3000,
            )
        except Exception:
            # No detectable "started loading" state — fall through and
            # rely purely on the text-based wait below.
            pass

        try:
            page.wait_for_function(
                """(btn) => {
                    return btn.disabled !== true
                        && btn.getAttribute('aria-busy') !== 'true'
                        && btn.querySelector('.spinner, .loading, [class*="loading"]') === null;
                }""",
                arg=button.element_handle(),
                timeout=timeout_ms,
            )
        except Exception:
            pass

    @staticmethod
    def _get_full_editor_text(page, editor_index=-1, timeout_ms=30000, stable_checks=3, poll_interval_ms=400):
        """
        Reads the FULL text content of a Monaco editor instance directly
        from its JS model, bypassing DOM virtualization (which only
        renders visible lines and undercounts/misreads long content).

        editor_index=-1 targets the last editor instance on the page
        (i.e. the output editor), matching your original ".nth(count-1)"
        intent.
        """

        js = """
        (idx) => {
            if (!window.monaco || !window.monaco.editor) {
                return null; // Monaco global API not exposed on this page
            }
            const models = window.monaco.editor.getModels();
            if (!models || models.length === 0) return null;
            const i = idx < 0 ? models.length + idx : idx;
            const model = models[i];
            if (!model) return null;
            return model.getValue();
        }
        """

        start = time.time()
        last_text = None
        stable_count = 0

        while (time.time() - start) * 1000 < timeout_ms:
            try:
                text = page.evaluate(js, editor_index)
            except Exception:
                text = None

            if text is not None:
                text = text.strip()
                is_placeholder = not text or "will appear here" in text.lower()

                if not is_placeholder:
                    if text == last_text:
                        stable_count += 1
                        if stable_count >= stable_checks:
                            return text
                    else:
                        stable_count = 0
                    last_text = text
                else:
                    last_text = None
                    stable_count = 0
            else:
                # Monaco global API unavailable — fall back to DOM scraping
                # for this poll iteration only.
                fallback = AivenService._read_output_text_dom(page)
                if fallback and "will appear here" not in fallback.lower():
                    if fallback == last_text:
                        stable_count += 1
                        if stable_count >= stable_checks:
                            return fallback
                    else:
                        stable_count = 0
                    last_text = fallback
                else:
                    last_text = None
                    stable_count = 0

            page.wait_for_timeout(poll_interval_ms)

        return last_text or ""

    @staticmethod
    def _read_output_text_dom(page) -> str:
        """DOM-based fallback (subject to virtualization limits)."""
        editors = page.locator(".monaco-editor")
        count = editors.count()
        if count < 2:
            return ""
        output_editor = editors.nth(count - 1)
        lines = output_editor.locator(".view-line")
        line_count = lines.count()
        if line_count == 0:
            return ""
        return "\n".join(
            lines.nth(i).inner_text() for i in range(line_count)
        ).strip()