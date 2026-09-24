import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")