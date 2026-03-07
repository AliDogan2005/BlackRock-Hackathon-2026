import os

try:
    from .city_watcher_core import run_city_watcher
    from .official_sources import CHICAGO_CONFIG
except ImportError:
    from city_watcher_core import run_city_watcher
    from official_sources import CHICAGO_CONFIG


OPENAI_API_KEY = os.environ.get(
    "OPENAI_API_KEY",
    "",
)
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
CHICAGO_API_KEY_ID = os.environ.get(CHICAGO_CONFIG.api_key_id_env, CHICAGO_CONFIG.api_key_id_default)
CHICAGO_API_KEY_SECRET = os.environ.get(
    CHICAGO_CONFIG.api_key_secret_env,
    CHICAGO_CONFIG.api_key_secret_default,
)


if __name__ == "__main__":
    try:
        run_city_watcher(
            config=CHICAGO_CONFIG,
            openai_api_key=OPENAI_API_KEY,
            model=OPENAI_MODEL,
            api_key_id=CHICAGO_API_KEY_ID,
            api_key_secret=CHICAGO_API_KEY_SECRET,
        )
    except KeyboardInterrupt:
        print("INFO [SHUTDOWN] Stopped by user.")
