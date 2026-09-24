from prompt_builder.builder import PromptBuilder
from adapters.gemini_adapter import GeminiAdapter

builder = PromptBuilder()
adapter = GeminiAdapter()

user_prompt = """
Please explain Django authentication in complete detail with examples.
"""

llm_prompt = builder.build_balanced_prompt(user_prompt)

response = adapter.optimize(llm_prompt)

print(response)