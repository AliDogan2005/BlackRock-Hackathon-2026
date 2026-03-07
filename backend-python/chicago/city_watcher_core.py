import json
import os
import time
from pathlib import Path
from typing import Any

try:
    from .city_geographies import load_geography_catalogs
    from .impact_schema import enrich_item, should_refresh_analysis
    from .official_sources import CityConfig, build_headers, fetch_news_items
except ImportError:
    from city_geographies import load_geography_catalogs
    from impact_schema import enrich_item, should_refresh_analysis
    from official_sources import CityConfig, build_headers, fetch_news_items


def load_existing_items(output_path: Path) -> list[dict[str, Any]]:
    if not output_path.exists():
        return []

    try:
        data = json.loads(output_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"ERROR [JSON_READ] {output_path} invalid JSON: {exc}")
        return []
    except OSError as exc:
        print(f"ERROR [FILE_READ] {output_path}: {exc}")
        return []

    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]

    print(f"ERROR [FILE_FORMAT] {output_path} must contain a JSON list.")
    return []


def save_items(output_path: Path, items: list[dict[str, Any]]) -> None:
    output_path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"SUCCESS [WRITE] {len(items)} items saved to {output_path}")


def backfill_items(
    items: list[dict[str, Any]],
    config: CityConfig,
    catalogs: dict[str, Any],
    openai_api_key: str,
    model: str,
) -> tuple[list[dict[str, Any]], bool]:
    if not openai_api_key:
        return items, False

    changed = False
    updated_items: list[dict[str, Any]] = []

    for item in items:
        if not should_refresh_analysis(item):
            updated_items.append(item)
            continue

        changed = True
        refreshed = enrich_item(item, config, catalogs, openai_api_key, model)
        if refreshed is not None:
            updated_items.append(refreshed)
            print("INFO [BACKFILL] analyzed", item.get("title"))
        else:
            print("INFO [BACKFILL] removed as irrelevant", item.get("title"))
        time.sleep(0.6)

    return updated_items, changed


def merge_new_items(
    existing: list[dict[str, Any]],
    fresh: list[dict[str, Any]],
    config: CityConfig,
    catalogs: dict[str, Any],
    openai_api_key: str,
    model: str,
) -> list[dict[str, Any]]:
    seen_ids = {str(item.get("id") or item.get("link") or item.get("title")) for item in existing}
    output = list(existing)

    for item in fresh:
        unique_id = str(item.get("id") or item.get("link") or item.get("title"))
        if unique_id in seen_ids:
            continue
        seen_ids.add(unique_id)

        enriched = enrich_item(item, config, catalogs, openai_api_key, model)
        if enriched is None:
            continue

        output.append(enriched)
        print(
            "INFO [ADD]",
            enriched.get("risk_level"),
            enriched.get("potential_level"),
            enriched.get("title"),
        )
        time.sleep(0.6)

    output.sort(
        key=lambda entry: (
            str(entry.get("published_at", "")),
            str(entry.get("fetched_at", "")),
        ),
        reverse=True,
    )
    return output


def run_cycle(
    config: CityConfig,
    output_path: Path,
    openai_api_key: str,
    model: str,
    api_key_id: str,
    api_key_secret: str,
) -> None:
    headers = build_headers(config, api_key_id, api_key_secret)
    catalogs = load_geography_catalogs(config, headers=headers)
    existing, changed_from_backfill = backfill_items(
        load_existing_items(output_path),
        config,
        catalogs,
        openai_api_key,
        model,
    )
    fresh = fetch_news_items(config, headers)
    merged = merge_new_items(existing, fresh, config, catalogs, openai_api_key, model)

    if len(merged) == len(existing) and not changed_from_backfill:
        print("INFO [CYCLE] No new real-estate/investment items detected.")
        return

    save_items(output_path, merged)
    print(f"INFO [CYCLE] Added {len(merged) - len(existing)} new relevant items.")


def run_city_watcher(
    config: CityConfig,
    openai_api_key: str,
    model: str,
    api_key_id: str,
    api_key_secret: str,
) -> None:
    output_path = Path(__file__).resolve().parent / config.output_filename
    poll_interval_seconds = int(os.environ.get("POLL_INTERVAL_SECONDS", "900"))
    run_once = os.environ.get("RUN_ONCE", "").lower() in {"1", "true", "yes"}

    print(
        f"INFO [START] {config.city}, {config.state} watcher started. "
        f"Poll interval: {poll_interval_seconds}s"
    )
    print(f"INFO [OUTPUT] Writing to {output_path.resolve()}")

    while True:
        run_cycle(
            config=config,
            output_path=output_path,
            openai_api_key=openai_api_key,
            model=model,
            api_key_id=api_key_id,
            api_key_secret=api_key_secret,
        )
        if run_once:
            break
        time.sleep(poll_interval_seconds)

