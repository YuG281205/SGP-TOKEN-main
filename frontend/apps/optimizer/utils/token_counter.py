from .openai_tokens import count_openai_tokens
from .claude_tokens import count_claude_tokens


def count_tokens(model_name, prompt):

    if model_name in ["gpt-4o", "gpt-4.1"]:
        return count_openai_tokens(model_name, prompt)

    elif model_name == "claude":
        return count_claude_tokens(prompt)

    elif model_name == "gemini":
        raise NotImplementedError("Gemini token counting not implemented.")

    elif model_name == "deepseek":
        raise NotImplementedError("DeepSeek token counting not implemented.")

    elif model_name == "llama":
        raise NotImplementedError("Llama token counting not implemented.")

    else:
        raise ValueError(f"Unsupported model: {model_name}")