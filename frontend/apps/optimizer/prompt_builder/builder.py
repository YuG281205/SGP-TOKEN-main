from pathlib import Path


class PromptBuilder:
    """
    Builds prompts that are sent to LLMs.
    """

    def __init__(self):
        self.prompt_dir = Path(__file__).parent.parent / "prompts"

    def _load_template(self, filename: str) -> str:
        template_path = self.prompt_dir / filename

        with open(template_path, "r", encoding="utf-8") as file:
            return file.read()

    def build_balanced_prompt(self, cleaned_prompt: str) -> str:
        template = self._load_template("balanced_prompt.txt")
        print(template)
        return template.replace("{PROMPT}", cleaned_prompt)