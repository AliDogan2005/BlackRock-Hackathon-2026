import os

try:
    from .city_watcher_core import run_city_watcher
    from .official_sources import DALLAS_CONFIG
except ImportError:
    from city_watcher_core import run_city_watcher
    from official_sources import DALLAS_CONFIG


OPENAI_API_KEY = os.environ.get(
    "OPENAI_API_KEY",
    "",
)
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
DALLAS_API_KEY_ID = os.environ.get(DALLAS_CONFIG.api_key_id_env, DALLAS_CONFIG.api_key_id_default)
DALLAS_API_KEY_SECRET = os.environ.get(
    DALLAS_CONFIG.api_key_secret_env,
    DALLAS_CONFIG.api_key_secret_default,
)


if __name__ == "__main__":
    try:
        run_city_watcher(
            config=DALLAS_CONFIG,
            openai_api_key=OPENAI_API_KEY,
            model=OPENAI_MODEL,
            api_key_id=DALLAS_API_KEY_ID,
            api_key_secret=DALLAS_API_KEY_SECRET,
        )
    except KeyboardInterrupt:
        print("INFO [SHUTDOWN] Stopped by user.")
