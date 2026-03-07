from __future__ import annotations

import json
import math
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
GLOBAL_NEWS_PATH = BASE_DIR / "news.json"
OUTPUT_PATH = BASE_DIR / "prices_output.json"


@dataclass(frozen=True)
class CitySource:
    slug: str
    city: str
    state: str
    baseline_home_value: float
    json_path: Path


CITY_SOURCES: tuple[CitySource, ...] = (
    CitySource(
        slug="chicago",
        city="Chicago",
        state="Illinois",
        baseline_home_value=305_295,
        json_path=BASE_DIR / "chicago" / "chicagogov.json",
    ),
    CitySource(
        slug="dallas",
        city="Dallas",
        state="Texas",
        baseline_home_value=301_697,
        json_path=BASE_DIR / "chicago" / "dallasgov.json",
    ),
    CitySource(
        slug="losangeles",
        city="Los Angeles",
        state="California",
        baseline_home_value=933_111,
        json_path=BASE_DIR / "chicago" / "losangelesgov.json",
    ),
    CitySource(
        slug="nyc",
        city="New York City",
        state="New York",
        baseline_home_value=649_000,
        json_path=BASE_DIR / "chicago" / "nycgov.json",
    ),
)

GLOBAL_RSS_FEEDS = (
    "https://news.google.com/rss/search?q=us+housing+market",
    "https://news.google.com/rss/search?q=real+estate+market+mortgage+rates",
)

PANIC_KEYWORDS = (
    "crash",
    "panic",
    "war",
    "sell-off",
    "selloff",
    "stagflation",
    "recession",
    "inflation",
    "oil prices",
    "jobs loss",
    "tumble",
    "shock",
    "fear",
    "volatility",
)
STABILITY_KEYWORDS = (
    "stable",
    "stability",
    "soft landing",
    "balanced",
    "steady",
    "resilient",
    "normalization",
    "normalize",
)
GROWTH_KEYWORDS = (
    "rebound",
    "recovery",
    "growth",
    "rise",
    "rally",
    "expansion",
    "investment",
    "development",
    "approval",
    "housing supply",
)
PULLBACK_KEYWORDS = (
    "decline",
    "drop",
    "down",
    "weak demand",
    "price cuts",
    "oversupply",
    "slump",
    "cooling",
    "slowdown",
)

TOPIC_WEIGHTS = {
    "real_estate": 1.20,
    "housing": 1.15,
    "infrastructure": 0.95,
    "redevelopment": 1.05,
    "economy": 0.90,
    "transportation": 0.88,
    "environment": 0.80,
}
POTENTIAL_WEIGHTS = {
    "high": 1.15,
    "medium": 1.00,
    "low": 0.88,
    "pending": 0.80,
}
RISK_WEIGHTS = {
    "low": 1.08,
    "medium": 1.00,
    "high": 0.92,
    "pending": 0.85,
}
DIRECTION_FACTORS = {
    "positive": 1.0,
    "mixed": 0.30,
    "neutral": 0.0,
    "negative": -1.0,
}

PREMIUM_HINTS = (
    "high property values",
    "high rental prices",
    "luxury",
    "upscale",
    "premium",
    "high-demand area",
    "high demand area",
    "strong housing demand",
    "significant redevelopment",
)
DISCOUNT_HINTS = (
    "affordable housing",
    "low-income",
    "economic limitations",
    "subsidized",
    "workforce housing",
    "vulnerable",
    "limited current investment",
    "low current investment",
)


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def load_json_list(path: Path) -> list[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    except json.JSONDecodeError as exc:
        print(f"ERROR [JSON_READ] {path} invalid JSON: {exc}")
        return []
    except OSError as exc:
        print(f"ERROR [FILE_READ] {path}: {exc}")
        return []

    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def parse_timestamp(value: Any) -> datetime | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None

    try:
        if text.endswith("Z"):
            return datetime.fromisoformat(text.replace("Z", "+00:00"))
        return datetime.fromisoformat(text)
    except ValueError:
        pass

    try:
        parsed = parsedate_to_datetime(text)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError, IndexError):
        return None


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def text_blob(*parts: Any) -> str:
    return " ".join(str(part) for part in parts if part).lower()


def count_keyword_hits(text: str, keywords: tuple[str, ...]) -> int:
    return sum(text.count(keyword) for keyword in keywords)


def compute_recency_weight(timestamp: datetime | None, decay_days: int = 60) -> float:
    if timestamp is None:
        return 0.70
    age_days = max(0.0, (now_utc() - timestamp).total_seconds() / 86_400)
    return 0.50 + 0.50 * math.exp(-age_days / decay_days)


def infer_premium_adjustment(reason: str, evidence_signals: list[str]) -> float:
    blob = text_blob(reason, " ".join(evidence_signals))
    score = 0.0
    for hint in PREMIUM_HINTS:
        if hint in blob:
            score += 0.022
    for hint in DISCOUNT_HINTS:
        if hint in blob:
            score -= 0.020
    return clamp(score, -0.12, 0.18)


def build_global_news_pool() -> list[dict[str, Any]]:
    items = load_json_list(GLOBAL_NEWS_PATH)
    headers = {"User-Agent": "nexus-pricing-engine/1.0"}

    for feed_url in GLOBAL_RSS_FEEDS:
        try:
            request = urllib.request.Request(feed_url, headers=headers)
            with urllib.request.urlopen(request, timeout=8) as response:
                raw = response.read()
        except (urllib.error.URLError, TimeoutError, OSError):
            continue

        try:
            root = ET.fromstring(raw)
        except ET.ParseError:
            continue

        for item in root.findall(".//item")[:12]:
            title = (item.findtext("title") or "").strip()
            description = (item.findtext("description") or "").strip()
            published_at = (item.findtext("pubDate") or "").strip()
            if not title and not description:
                continue
            items.append(
                {
                    "title": title,
                    "description": description,
                    "published_at": published_at,
                }
            )

    return items


def build_global_market_context() -> dict[str, Any]:
    news_items = build_global_news_pool()
    if not news_items:
        return {
            "regime": "stable",
            "share_multiplier": 1.0,
            "summary": "No macro news was available, so prices stay close to baseline.",
            "headline_samples": [],
        }

    fear_score = 0.0
    stability_score = 0.0
    growth_score = 0.0
    pullback_score = 0.0
    headline_samples: list[str] = []
    seen_titles: set[str] = set()

    for item in news_items:
        title = str(item.get("title", "")).strip()
        description = str(item.get("description", "")).strip()
        timestamp = parse_timestamp(item.get("published_at") or item.get("timestamp"))
        recency_weight = compute_recency_weight(timestamp, decay_days=21)
        blob = text_blob(title, description)

        fear_score += count_keyword_hits(blob, PANIC_KEYWORDS) * recency_weight
        stability_score += count_keyword_hits(blob, STABILITY_KEYWORDS) * recency_weight
        growth_score += count_keyword_hits(blob, GROWTH_KEYWORDS) * recency_weight
        pullback_score += count_keyword_hits(blob, PULLBACK_KEYWORDS) * recency_weight

        if title and title not in seen_titles and len(headline_samples) < 5:
            seen_titles.add(title)
            headline_samples.append(title)

    if fear_score >= max(stability_score, growth_score, pullback_score) + 1.5:
        extra = clamp(fear_score * 0.003, 0.0, 0.04)
        share_multiplier = 1.05 + extra
        regime = "panic"
        summary = (
            "Macro panic is pushing investors toward real-estate backed assets, "
            "so neighborhood token prices get a defensive premium."
        )
    elif stability_score >= max(fear_score, pullback_score) and abs(growth_score - pullback_score) <= 1.5:
        share_multiplier = 1.0
        regime = "stable"
        summary = "Macro flow is balanced, so token prices remain close to structural neighborhood value."
    elif growth_score > pullback_score + 1:
        extra = clamp((growth_score - pullback_score) * 0.0025, 0.0, 0.03)
        share_multiplier = 1.02 + extra
        regime = "growth"
        summary = "Growth and recovery headlines are improving risk appetite and lifting property-linked token prices."
    elif pullback_score > growth_score + 1:
        reduction = clamp((pullback_score - growth_score) * 0.003, 0.0, 0.05)
        share_multiplier = 1.0 - reduction
        regime = "pullback"
        summary = "Cooling demand and slower macro momentum are pulling token prices slightly below baseline."
    else:
        share_multiplier = 1.0
        regime = "stable"
        summary = "Signals are mixed, so the engine keeps prices near baseline."

    return {
        "regime": regime,
        "share_multiplier": round(share_multiplier, 4),
        "summary": summary,
        "headline_samples": headline_samples,
        "fear_score": round(fear_score, 2),
        "stability_score": round(stability_score, 2),
        "growth_score": round(growth_score, 2),
        "pullback_score": round(pullback_score, 2),
    }


def aggregate_city_neighborhoods(source: CitySource) -> list[dict[str, Any]]:
    articles = load_json_list(source.json_path)
    rollups: dict[str, dict[str, Any]] = {}
    recent_cutoff = now_utc() - timedelta(days=21)

    for article in articles:
        impact_analysis = article.get("impact_analysis")
        if not isinstance(impact_analysis, dict):
            continue

        scores = impact_analysis.get("all_neighborhood_scores")
        if not isinstance(scores, list):
            continue

        timestamp = parse_timestamp(article.get("published_at") or article.get("fetched_at"))
        article_weight = (
            TOPIC_WEIGHTS.get(str(article.get("topic", "")).lower(), 0.85)
            * POTENTIAL_WEIGHTS.get(str(article.get("potential_level", "")).lower(), 1.0)
            * RISK_WEIGHTS.get(str(article.get("risk_level", "")).lower(), 1.0)
            * compute_recency_weight(timestamp)
        )

        for score in scores:
            if not isinstance(score, dict):
                continue

            name = str(score.get("name", "")).strip()
            if not name:
                continue

            impact_score = float(score.get("impact_score", 0) or 0)
            confidence = float(score.get("confidence", 0) or 0)
            direction = str(score.get("impact_direction", "neutral")).lower()
            signed_impact = impact_score * DIRECTION_FACTORS.get(direction, 0.0)
            confidence_weight = 0.70 + clamp(confidence, 0.0, 100.0) / 100.0 * 0.30
            weighted_impact = signed_impact * article_weight * confidence_weight
            evidence_signals = score.get("evidence_signals", [])
            if not isinstance(evidence_signals, list):
                evidence_signals = []

            bucket = rollups.setdefault(
                name,
                {
                    "weighted_impact_total": 0.0,
                    "recent_impact_total": 0.0,
                    "weight_total": 0.0,
                    "recent_weight_total": 0.0,
                    "confidence_total": 0.0,
                    "mentions": 0,
                    "premium_total": 0.0,
                    "signals": [],
                    "latest_reason": "",
                },
            )
            bucket["weighted_impact_total"] += weighted_impact
            bucket["weight_total"] += article_weight
            bucket["confidence_total"] += confidence * article_weight
            bucket["mentions"] += 1
            bucket["premium_total"] += infer_premium_adjustment(str(score.get("reason_en", "")), evidence_signals)

            if timestamp and timestamp >= recent_cutoff:
                recent_boost = 1.15 if timestamp >= now_utc() - timedelta(days=7) else 1.0
                bucket["recent_impact_total"] += weighted_impact * recent_boost
                bucket["recent_weight_total"] += article_weight

            if not bucket["latest_reason"] and score.get("reason_en"):
                bucket["latest_reason"] = str(score.get("reason_en", ""))

            for signal in evidence_signals:
                clean_signal = str(signal).strip()
                if clean_signal and clean_signal not in bucket["signals"] and len(bucket["signals"]) < 4:
                    bucket["signals"].append(clean_signal)

    neighborhoods: list[dict[str, Any]] = []
    for name, bucket in rollups.items():
        weight_total = bucket["weight_total"] or 1.0
        recent_weight_total = bucket["recent_weight_total"] or 1.0
        local_news_score = bucket["weighted_impact_total"] / weight_total
        recent_momentum_score = bucket["recent_impact_total"] / recent_weight_total
        premium_adjustment = bucket["premium_total"] / max(1, bucket["mentions"])
        structural_multiplier = clamp(1.0 + (local_news_score / 520.0) + premium_adjustment, 0.65, 1.75)
        estimated_home_price = source.baseline_home_value * structural_multiplier
        base_share_price = estimated_home_price / 15_000.0

        neighborhoods.append(
            {
                "city": source.city,
                "state": source.state,
                "neighborhood": name,
                "estimated_average_home_price_usd": round(estimated_home_price, 2),
                "share_token_base_price_usd": round(base_share_price, 4),
                "local_news_score": round(local_news_score, 2),
                "recent_momentum_score": round(recent_momentum_score, 2),
                "confidence_score": round(bucket["confidence_total"] / weight_total, 2),
                "premium_adjustment": round(premium_adjustment, 4),
                "mention_count": bucket["mentions"],
                "signals": bucket["signals"],
                "reason": bucket["latest_reason"],
            }
        )

    neighborhoods.sort(
        key=lambda item: (
            -float(item["estimated_average_home_price_usd"]),
            str(item["neighborhood"]).casefold(),
        )
    )
    return neighborhoods


def classify_price_action(live_price: float, base_price: float) -> str:
    if live_price >= base_price * 1.015:
        return "increase"
    if live_price <= base_price * 0.985:
        return "decrease"
    return "stable"


def build_neighborhood_analysis(
    neighborhood: dict[str, Any],
    global_context: dict[str, Any],
) -> str:
    action = neighborhood["price_action"]
    if action == "increase":
        action_text = "is trading above the structural share baseline"
    elif action == "decrease":
        action_text = "is trading below the structural share baseline"
    else:
        action_text = "is holding near the structural share baseline"

    return (
        f"{neighborhood['neighborhood']} in {neighborhood['city']} has an estimated average home value of "
        f"${neighborhood['estimated_average_home_price_usd']:,.2f}. "
        f"Local government news score is {neighborhood['local_news_score']}, "
        f"the macro regime is {global_context['regime']}, and the live Nexus share token {action_text} "
        f"at ${neighborhood['share_token_live_price_usd']:,.4f}."
    )


def build_price_book() -> dict[str, Any]:
    global_context = build_global_market_context()
    cities: dict[str, Any] = {}

    for source in CITY_SOURCES:
        neighborhoods = aggregate_city_neighborhoods(source)
        live_rows: list[dict[str, Any]] = []

        for neighborhood in neighborhoods:
            local_live_multiplier = clamp(
                1.0 + float(neighborhood["recent_momentum_score"]) / 1200.0,
                0.95,
                1.08,
            )
            live_share_price = float(neighborhood["share_token_base_price_usd"]) * float(
                global_context["share_multiplier"]
            ) * local_live_multiplier

            enriched = dict(neighborhood)
            enriched["macro_regime"] = global_context["regime"]
            enriched["global_news_multiplier"] = global_context["share_multiplier"]
            enriched["local_live_multiplier"] = round(local_live_multiplier, 4)
            enriched["share_token_live_price_usd"] = round(live_share_price, 4)
            enriched["price_action"] = classify_price_action(
                enriched["share_token_live_price_usd"],
                float(enriched["share_token_base_price_usd"]),
            )
            enriched["analysis"] = build_neighborhood_analysis(enriched, global_context)
            live_rows.append(enriched)

        average_share_price = 0.0
        if live_rows:
            average_share_price = sum(
                float(row["share_token_live_price_usd"]) for row in live_rows
            ) / len(live_rows)

        cities[source.slug] = {
            "city": source.city,
            "state": source.state,
            "baseline_city_home_value_usd": source.baseline_home_value,
            "macro_regime": global_context["regime"],
            "city_average_live_share_price_usd": round(average_share_price, 4),
            "top_10_neighborhoods": sorted(
                live_rows,
                key=lambda row: (-float(row["share_token_live_price_usd"]), str(row["neighborhood"]).casefold()),
            )[:10],
            "neighborhoods": live_rows,
        }

    return {
        "generated_at": now_utc().isoformat(),
        "pricing_rule": "share_token_price = estimated_average_home_price / 15000, then adjusted by local news momentum and macro regime",
        "global_market_context": global_context,
        "cities": cities,
    }


def save_price_book(payload: dict[str, Any]) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"SUCCESS [WRITE] Saved price book to {OUTPUT_PATH}")


def print_summary(payload: dict[str, Any]) -> None:
    context = payload["global_market_context"]
    print(
        "INFO [MARKET]",
        f"regime={context['regime']}",
        f"multiplier={context['share_multiplier']}",
    )
    for city in payload["cities"].values():
        print(
            f"INFO [CITY] {city['city']} avg live share ${city['city_average_live_share_price_usd']:.4f}"
        )
        for row in city["top_10_neighborhoods"][:5]:
            print(
                "  -",
                row["neighborhood"],
                f"home=${row['estimated_average_home_price_usd']:,.2f}",
                f"share=${row['share_token_live_price_usd']:,.4f}",
                f"action={row['price_action']}",
            )


def main() -> None:
    payload = build_price_book()
    save_price_book(payload)
    print_summary(payload)


if __name__ == "__main__":
    main()
