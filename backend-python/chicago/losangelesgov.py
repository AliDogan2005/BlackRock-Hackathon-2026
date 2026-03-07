import os

try:
    from .city_watcher_core import run_city_watcher
    from .official_sources import LOS_ANGELES_CONFIG
except ImportError:
    from city_watcher_core import run_city_watcher
    from official_sources import LOS_ANGELES_CONFIG


OPENAI_API_KEY = os.environ.get(
    "OPENAI_API_KEY",
    "",
)
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
LOS_ANGELES_API_KEY_ID = os.environ.get(
    LOS_ANGELES_CONFIG.api_key_id_env,
    LOS_ANGELES_CONFIG.api_key_id_default,
)
LOS_ANGELES_API_KEY_SECRET = os.environ.get(
    LOS_ANGELES_CONFIG.api_key_secret_env,
    LOS_ANGELES_CONFIG.api_key_secret_default,
)


if __name__ == "__main__":
    try:
        run_city_watcher(
            config=LOS_ANGELES_CONFIG,
            openai_api_key=OPENAI_API_KEY,
            model=OPENAI_MODEL,
            api_key_id=LOS_ANGELES_API_KEY_ID,
            api_key_secret=LOS_ANGELES_API_KEY_SECRET,
        )
    except KeyboardInterrupt:
        print("INFO [SHUTDOWN] Stopped by user.")
