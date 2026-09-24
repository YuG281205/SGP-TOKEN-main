from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Browser profile
PROFILE_PATH_1 = PROJECT_ROOT / "apps" / "comparison1" / "playwright" / "playwright_profile1"
PROFILE_PATH_2 = PROJECT_ROOT / "apps" / "comparison1" / "playwright" / "playwright_profile2"
PROFILE_PATH_3 = PROJECT_ROOT / "apps" / "comparison1" / "playwright" / "playwright_profile3"


# Playwright outputs
OUTPUT_DIR = PROJECT_ROOT / "apps" / "comparison1" / "playwright" / "playwright_output_aiven"

TRACE_DIR = OUTPUT_DIR / "traces"
HAR_DIR = OUTPUT_DIR / "har"

# Django media folder
SCREENSHOT_DIR = PROJECT_ROOT / "media" / "comparison_images"

LOG_DIR = OUTPUT_DIR / "logs"

# Show browser while developing
HEADLESS = False

# Default timeout (milliseconds)
TIMEOUT = 30000

# Website to automate
AIVEN_URL = "https://aiven.io/tools/prompt-optimizer"

FREE_PROMPT_GENERATOR = "https://promptopt.app/optimizer/en"

NUMSTACK_URL = "https://numstack.net/calculators/prompt-optimizer"

# Create directories if they don't exist
for folder in [
    PROFILE_PATH_1,
    PROFILE_PATH_2,
    PROFILE_PATH_3,
    OUTPUT_DIR,
    TRACE_DIR,
    HAR_DIR,
    SCREENSHOT_DIR,
    LOG_DIR,
]:
    folder.mkdir(parents=True, exist_ok=True)

from pathlib import Path

