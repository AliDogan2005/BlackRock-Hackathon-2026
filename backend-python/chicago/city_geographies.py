import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

try:
    from .official_sources import CityConfig, GeographySourceConfig
except ImportError:
    from official_sources import CityConfig, GeographySourceConfig


def _request_json(url: str, headers: dict[str, str], timeout: int = 30) -> Any:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _normalize_name(value: str, prefix: str) -> str:
    cleaned = " ".join((value or "").split()).strip()
    if not cleaned:
        return ""
    if prefix and not cleaned.startswith(prefix):
        return f"{prefix}{cleaned}"
    return cleaned


def _dedupe_sorted(values: list[str]) -> list[str]:
    deduped: dict[str, str] = {}
    for value in values:
        key = value.casefold()
        if key not in deduped:
            deduped[key] = value
    return sorted(deduped.values(), key=lambda item: item.casefold())


def _extract_socrata_names(source: GeographySourceConfig, headers: dict[str, str]) -> list[str]:
    rows = _request_json(source.url, headers=headers)
    if not isinstance(rows, list):
        return []
    values: list[str] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = _normalize_name(str(row.get(source.field, "")).strip(), source.prefix)
        if name:
            values.append(name)
    return _dedupe_sorted(values)


def _extract_arcgis_names(source: GeographySourceConfig, headers: dict[str, str]) -> list[str]:
    payload = _request_json(source.url, headers=headers)
    features = payload.get("features", []) if isinstance(payload, dict) else []
    values: list[str] = []
    for feature in features:
        attributes = feature.get("attributes", {}) if isinstance(feature, dict) else {}
        if not isinstance(attributes, dict):
            continue
        name = _normalize_name(str(attributes.get(source.field, "")).strip(), source.prefix)
        if name:
            values.append(name)
    return _dedupe_sorted(values)


def _fetch_names(source: GeographySourceConfig, headers: dict[str, str]) -> list[str]:
    if source.source_type == "socrata":
        return _extract_socrata_names(source, headers)
    if source.source_type == "arcgis":
        return _extract_arcgis_names(source, headers)
    raise ValueError(f"Unsupported geography source type: {source.source_type}")


def _cache_path(config: CityConfig) -> Path:
    return Path(__file__).with_name(f"{config.slug}_geographies_cache.json")


def load_geography_catalogs(
    config: CityConfig,
    headers: dict[str, str],
    force_refresh: bool = False,
) -> dict[str, Any]:
    cache_path = _cache_path(config)
    if cache_path.exists() and not force_refresh:
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            if isinstance(cached, dict):
                areas = cached.get("areas", [])
                neighborhoods = cached.get("neighborhoods", [])
                if isinstance(areas, list) and isinstance(neighborhoods, list) and areas and neighborhoods:
                    return cached
        except (OSError, json.JSONDecodeError):
            pass

    try:
        areas = _fetch_names(config.area_source, headers)
    except urllib.error.URLError as exc:
        print(f"ERROR [GEO_FETCH] {config.area_source.label} -> {exc}")
        areas = []

    try:
        neighborhoods = _fetch_names(config.neighborhood_source, headers)
    except urllib.error.URLError as exc:
        print(f"ERROR [GEO_FETCH] {config.neighborhood_source.label} -> {exc}")
        neighborhoods = []

    payload = {
        "city": config.city,
        "state": config.state,
        "area_source_label": config.area_source.label,
        "neighborhood_source_label": config.neighborhood_source.label,
        "geography_type_area": config.geography_type_area,
        "geography_type_neighborhood": config.geography_type_neighborhood,
        "areas": areas,
        "neighborhoods": neighborhoods,
    }

    try:
        cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError as exc:
        print(f"ERROR [GEO_CACHE_WRITE] {cache_path}: {exc}")

    return payload

