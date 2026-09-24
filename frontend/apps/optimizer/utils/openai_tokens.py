import tiktoken

def count_openai_tokens(model_name,prompt):
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except KeyError:
        encoding = tiktoken.get_encoding("o200k_base")
    
    return len(encoding.encode(prompt))