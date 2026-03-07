import json
import urllib.error
import urllib.request
from typing import Any

try:
    from .official_sources import CityConfig, now_iso
except ImportError:
    from official_sources import CityConfig, now_iso


DEFAULT_SCORE = {
    "impact_score": 0,
    "impact_direction": "neutral",
    "confidence": 0,
    "reason_en": "No credible localized impact was identified for this geography from the article.",
    "evidence_signals": [],
}


def looks_relevant(text: str, keyword_hints: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in keyword_hints)


def assign_segment(risk_level: str, potential_level: str) -> str:
    mapping = {
        ("low", "high"): "safe_opportunity",
        ("medium", "high"): "growth_opportunity",
        ("high", "high"): "aggressive_opportunity",
        ("low", "medium"): "stable_income",
        ("medium", "medium"): "balanced_watch",
        ("high", "medium"): "speculative_watch",
        ("low", "low"): "limited_upside",
        ("medium", "low"): "cautious_avoid",
        ("high", "low"): "high_risk_avoid",
    }
    return mapping.get((risk_level, potential_level), "balanced_watch")


def _openai_request(openai_api_key: str, model: str, messages: list[dict[str, str]]) -> dict[str, Any]:
    payload = {
        "model": model,
        "response_format": {"type": "json_object"},
        "messages": messages,
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as response:
        body = json.loads(response.read().decode("utf-8"))
    content = body.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    return json.loads(content)


def _safe_openai_request(openai_api_key: str, model: str, messages: list[dict[str, str]]) -> dict[str, Any]:
    try:
        return _openai_request(openai_api_key, model, messages)
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", "ignore")
        print(f"ERROR [OPENAI_HTTP] {exc.code}: {details}")
    except urllib.error.URLError as exc:
        print(f"ERROR [OPENAI_NETWORK] {exc}")
    except json.JSONDecodeError as exc:
        print(f"ERROR [OPENAI_PARSE] {exc}")
    except Exception as exc:
        print(f"ERROR [OPENAI_UNKNOWN] {type(exc).__name__}: {exc}")
    return {}


def _build_article_prompt(item: dict[str, Any], config: CityConfig) -> str:
    return (
        f"Evaluate the following {config.city}, {config.state} government news item.\n"
        "Mark it relevant only if it has a plausible real-estate, housing, redevelopment, "
        "capital allocation, infrastructure, or investment impact.\n"
        "Return valid JSON only.\n"
        "JSON schema:\n"
        "{\n"
        '  "is_relevant": true,\n'
        '  "topic": "real_estate|investment|both|infrastructure|irrelevant",\n'
        '  "risk_level": "low|medium|high",\n'
        '  "potential_level": "low|medium|high",\n'
        '  "commentary_en": "Detailed English summary focused on local market impact",\n'
        '  "reason_en": "Detailed English explanation of why this item matters",\n'
        '  "signals": ["signal 1", "signal 2", "signal 3"]\n'
        "}\n\n"
        f"Title: {item.get('title', '')}\n"
        f"Date: {item.get('published_at', '')}\n"
        f"Link: {item.get('link', '')}\n"
        f"Content: {item.get('description', '')[:6000]}"
    )


def analyze_article(
    item: dict[str, Any],
    config: CityConfig,
    openai_api_key: str,
    model: str,
) -> dict[str, Any]:
    if not openai_api_key:
        return {
            "is_relevant": False,
            "topic": "irrelevant",
            "risk_level": "medium",
            "potential_level": "medium",
            "commentary_en": "Analysis was skipped because OPENAI_API_KEY is not set.",
            "reason_en": "Missing OpenAI API key.",
            "signals": [],
        }

    response = _safe_openai_request(
        openai_api_key,
        model,
        [
            {
                "role": "system",
                "content": (
                    "You analyze local government news for real-estate and investment impact. "
                    "Return valid JSON only. Write in English."
                ),
            },
            {"role": "user", "content": _build_article_prompt(item, config)},
        ],
    )

    return {
        "is_relevant": bool(response.get("is_relevant")),
        "topic": str(response.get("topic", "irrelevant")),
        "risk_level": str(response.get("risk_level", "medium")).lower(),
        "potential_level": str(response.get("potential_level", "medium")).lower(),
        "commentary_en": str(response.get("commentary_en", "")),
        "reason_en": str(response.get("reason_en", "")),
        "signals": response.get("signals", []) if isinstance(response.get("signals", []), list) else [],
    }


def _normalize_score_entry(name: str, entry: dict[str, Any]) -> dict[str, Any]:
    impact_score = entry.get("impact_score", 0)
    confidence = entry.get("confidence", 0)
    try:
        impact_score = int(round(float(impact_score)))
    except Exception:
        impact_score = 0
    try:
        confidence = int(round(float(confidence)))
    except Exception:
        confidence = 0

    impact_direction = str(entry.get("impact_direction", "neutral")).lower()
    if impact_direction not in {"positive", "negative", "mixed", "neutral"}:
        impact_direction = "neutral"

    evidence_signals = entry.get("evidence_signals", [])
    if not isinstance(evidence_signals, list):
        evidence_signals = []

    return {
        "name": name,
        "impact_score": max(0, min(100, impact_score)),
        "impact_direction": impact_direction,
        "confidence": max(0, min(100, confidence)),
        "reason_en": str(entry.get("reason_en", DEFAULT_SCORE["reason_en"])),
        "evidence_signals": [str(signal) for signal in evidence_signals[:5]],
    }


def _score_prompt(
    item: dict[str, Any],
    config: CityConfig,
    geography_kind: str,
    geography_names: list[str],
) -> str:
    return (
        f"Analyze how the following {config.city}, {config.state} government news item may affect "
        f"these official {geography_kind} geographies.\n"
        "You must score every geography provided. Do not invent extra names. Use only the names in the list.\n"
        "Impact score means expected magnitude of effect on local real estate, redevelopment, housing demand, "
        "capital allocation, or infrastructure-linked investment from 0 to 100.\n"
        "Use low scores for places with little or no expected effect.\n"
        "Return valid JSON only.\n"
        "JSON schema:\n"
        "{\n"
        '  "scores": [\n'
        "    {\n"
        '      "name": "Exact geography name from the provided list",\n'
        '      "impact_score": 0,\n'
        '      "impact_direction": "positive|negative|mixed|neutral",\n'
        '      "confidence": 0,\n'
        '      "reason_en": "Detailed English reason for this geography",\n'
        '      "evidence_signals": ["signal 1", "signal 2"]\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        f"Article title: {item.get('title', '')}\n"
        f"Article date: {item.get('published_at', '')}\n"
        f"Article summary: {item.get('description', '')[:5000]}\n"
        f"Geography type: {geography_kind}\n"
        f"Geography names: {json.dumps(geography_names, ensure_ascii=False)}"
    )


def _default_scores(geography_names: list[str]) -> list[dict[str, Any]]:
    return [{"name": name, **DEFAULT_SCORE} for name in geography_names]


def _score_chunk(
    item: dict[str, Any],
    config: CityConfig,
    geography_kind: str,
    geography_names: list[str],
    openai_api_key: str,
    model: str,
) -> list[dict[str, Any]]:
    if not openai_api_key:
        return _default_scores(geography_names)

    response = _safe_openai_request(
        openai_api_key,
        model,
        [
            {
                "role": "system",
                "content": (
                    "You score official local geographies for local-news impact. "
                    "Return valid JSON only. Use the provided names exactly."
                ),
            },
            {"role": "user", "content": _score_prompt(item, config, geography_kind, geography_names)},
        ],
    )
    raw_scores = response.get("scores", []) if isinstance(response, dict) else []

    normalized: dict[str, dict[str, Any]] = {}
    if isinstance(raw_scores, list):
        expected_lookup = {name.casefold(): name for name in geography_names}
        for raw_score in raw_scores:
            if not isinstance(raw_score, dict):
                continue
            raw_name = str(raw_score.get("name", "")).strip()
            matched_name = expected_lookup.get(raw_name.casefold())
            if not matched_name:
                continue
            normalized[matched_name.casefold()] = _normalize_score_entry(matched_name, raw_score)

    output: list[dict[str, Any]] = []
    for name in geography_names:
        output.append(normalized.get(name.casefold(), _normalize_score_entry(name, DEFAULT_SCORE)))
    return output


def score_geography_catalog(
    item: dict[str, Any],
    config: CityConfig,
    geography_kind: str,
    geography_names: list[str],
    openai_api_key: str,
    model: str,
    chunk_size: int,
) -> list[dict[str, Any]]:
    if not geography_names:
        return []
    scores: list[dict[str, Any]] = []
    for start in range(0, len(geography_names), chunk_size):
        chunk = geography_names[start : start + chunk_size]
        scores.extend(_score_chunk(item, config, geography_kind, chunk, openai_api_key, model))
        time_buffer = 0.4 if len(geography_names) > chunk_size else 0
        if time_buffer:
            import time
            time.sleep(time_buffer)
    return scores


def _top_and_bottom(scores: list[dict[str, Any]], limit: int = 5) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    ordered = sorted(scores, key=lambda score: (-score["impact_score"], score["name"].casefold()))
    ascending = sorted(scores, key=lambda score: (score["impact_score"], score["name"].casefold()))
    return ordered[:limit], ascending[:limit]


def build_pending_item(item: dict[str, Any], config: CityConfig, catalogs: dict[str, Any]) -> dict[str, Any]:
    return {
        **item,
        "state": config.state,
        "city": config.city,
        "geography_type_area": config.geography_type_area,
        "geography_type_neighborhood": config.geography_type_neighborhood,
        "area_catalog": catalogs.get("areas", []),
        "neighborhood_catalog": catalogs.get("neighborhoods", []),
        "topic": "pending_openai",
        "risk_level": "pending",
        "potential_level": "pending",
        "segment": "pending",
        "commentary_en": "",
        "reason_en": "Analysis will be added when an OpenAI API key is available.",
        "signals": [],
        "impact_analysis": {
            "summary_en": "Pending OpenAI analysis.",
            "max_impacted": {"areas": [], "neighborhoods": []},
            "min_impacted": {"areas": [], "neighborhoods": []},
            "all_area_scores": [],
            "all_neighborhood_scores": [],
        },
        "analysis_status": "pending_openai",
        "analyzed_at": None,
    }


def apply_analysis(
    item: dict[str, Any],
    config: CityConfig,
    catalogs: dict[str, Any],
    article_analysis: dict[str, Any],
    area_scores: list[dict[str, Any]],
    neighborhood_scores: list[dict[str, Any]],
) -> dict[str, Any]:
    max_areas, min_areas = _top_and_bottom(area_scores)
    max_neighborhoods, min_neighborhoods = _top_and_bottom(neighborhood_scores)
    sanitized_item = dict(item)
    return {
        **sanitized_item,
        "state": config.state,
        "city": config.city,
        "geography_type_area": config.geography_type_area,
        "geography_type_neighborhood": config.geography_type_neighborhood,
        "area_catalog": catalogs.get("areas", []),
        "neighborhood_catalog": catalogs.get("neighborhoods", []),
        "topic": article_analysis.get("topic", "irrelevant"),
        "risk_level": article_analysis.get("risk_level", "medium"),
        "potential_level": article_analysis.get("potential_level", "medium"),
        "segment": assign_segment(
            str(article_analysis.get("risk_level", "medium")).lower(),
            str(article_analysis.get("potential_level", "medium")).lower(),
        ),
        "commentary_en": article_analysis.get("commentary_en", ""),
        "reason_en": article_analysis.get("reason_en", ""),
        "signals": article_analysis.get("signals", []),
        "impact_analysis": {
            "summary_en": article_analysis.get("commentary_en", ""),
            "max_impacted": {
                "areas": max_areas,
                "neighborhoods": max_neighborhoods,
            },
            "min_impacted": {
                "areas": min_areas,
                "neighborhoods": min_neighborhoods,
            },
            "all_area_scores": area_scores,
            "all_neighborhood_scores": neighborhood_scores,
        },
        "analysis_status": "completed",
        "analyzed_at": now_iso(),
    }


def should_refresh_analysis(item: dict[str, Any]) -> bool:
    impact_analysis = item.get("impact_analysis")
    return (
        item.get("analysis_status") == "pending_openai"
        or "state" not in item
        or "city" not in item
        or "area_catalog" not in item
        or "neighborhood_catalog" not in item
        or not isinstance(impact_analysis, dict)
        or "all_area_scores" not in impact_analysis
        or "all_neighborhood_scores" not in impact_analysis
    )


def enrich_item(
    item: dict[str, Any],
    config: CityConfig,
    catalogs: dict[str, Any],
    openai_api_key: str,
    model: str,
) -> dict[str, Any] | None:
    searchable_text = f"{item.get('title', '')} {item.get('description', '')}"
    if not looks_relevant(searchable_text, config.keyword_hints):
        return None

    if not openai_api_key:
        return build_pending_item(item, config, catalogs)

    article_analysis = analyze_article(item, config, openai_api_key, model)
    if not article_analysis.get("is_relevant"):
        return None

    area_scores = score_geography_catalog(
        item,
        config,
        config.geography_type_area,
        catalogs.get("areas", []),
        openai_api_key,
        model,
        chunk_size=40,
    )
    neighborhood_scores = score_geography_catalog(
        item,
        config,
        config.geography_type_neighborhood,
        catalogs.get("neighborhoods", []),
        openai_api_key,
        model,
        chunk_size=35,
    )
    return apply_analysis(item, config, catalogs, article_analysis, area_scores, neighborhood_scores)

