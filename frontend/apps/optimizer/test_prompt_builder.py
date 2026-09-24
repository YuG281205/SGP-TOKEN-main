from prompt_builder.builder import PromptBuilder

builder = PromptBuilder()

prompt = """
Please explain Django authentication in complete detail with examples and diagrams if possible.
"""

result = builder.build_balanced_prompt(prompt)

print(result)