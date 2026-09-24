from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# all-mpnet-base-v2 is the standard sentence-transformers choice for
# STS/paraphrase tasks — slower than MiniLM but produces scores that
# actually spread across the 0-100 range and correlate much better
# with human judgment of "is this the same meaning, reworded".
model = SentenceTransformer("all-mpnet-base-v2")


def calculate_semantic_accuracy(original_prompt, optimized_prompt):

    original_embedding = model.encode([original_prompt])
    optimized_embedding = model.encode([optimized_prompt])

    similarity = cosine_similarity(
        original_embedding,
        optimized_embedding
    )[0][0]

    return float(round(float(similarity) * 100, 2))

