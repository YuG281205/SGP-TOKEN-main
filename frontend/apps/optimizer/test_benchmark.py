from benchmark import GeminiBenchmark
import os 
API_KEY = os.getenv("GEMINI_API_KEY")

benchmark = GeminiBenchmark(API_KEY)

original = """
Explain Binary Search with an example.
"""

optimized = """
Explain Binary Search using a simple example suitable for beginners.
"""

result = benchmark.compare(
    original_prompt=original,
    optimized_prompt=optimized,
)

from pprint import pprint
pprint(result)