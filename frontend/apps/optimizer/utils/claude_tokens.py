from litellm import token_counter


def count_claude_tokens(prompt):

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    return token_counter(
        model="claude-sonnet-5",
        messages=messages
    )