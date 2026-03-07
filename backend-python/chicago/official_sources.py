import json
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Any


BASE_KEYWORDS = {
    "real estate",
    "housing",
    "affordable housing",
    "apartment",
    "apartments",
    "condo",
    "condominium",
    "mortgage",
    "property",
    "properties",
    "zoning",
    "rezoning",
    "redevelopment",
    "development",
    "land use",
    "land sale",
    "vacant lot",
    "commercial corridor",
    "construction",
    "lease",
    "leasing",
    "tenant",
    "homebuyer",
    "homebuyers",
    "housing trust",
    "housing fund",
    "invest",
    "investment",
    "investor",
    "capital",
    "fund",
    "infrastructure",
    "economic development",
    "transit oriented development",
    "mixed-use",
    "district",
    "corridor",
    "waterfront",
}


@dataclass(frozen=True)
class GeographySourceConfig:
    label: str
    source_type: str
    url: str
    field: str
    prefix: str = ""


@dataclass(frozen=True)
class CityConfig:
    slug: str
    city: str
    state: str
    output_filename: str
    api_key_id_env: str
    api_key_id_default: str
    api_key_secret_env: str
    api_key_secret_default: str
    geography_type_area: str
    geography_type_neighborhood: str
    area_source: GeographySourceConfig
    neighborhood_source: GeographySourceConfig
    news_source_kind: str
    news_source_urls: tuple[str, ...]
    keyword_hints: tuple[str, ...]
    user_agent_label: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def request_bytes(url: str, headers: dict[str, str], timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def build_headers(config: CityConfig, api_key_id: str, api_key_secret: str) -> dict[str, str]:
    headers = {
        "User-Agent": f"Mozilla/5.0 {config.user_agent_label}/1.0",
    }
    if config.news_source_kind == "rss":
        headers["Accept"] = "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
    else:
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    if api_key_id:
        headers["X-API-Key-Id"] = api_key_id
    if api_key_secret:
        headers["X-API-Key-Secret"] = api_key_secret
    return headers


def extract_tag(block: str, tag_name: str) -> str:
    match = re.search(
        rf"<{tag_name}\b[^>]*>(.*?)</{tag_name}>",
        block,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return ""
    value = match.group(1)
    value = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", value, flags=re.DOTALL)
    return strip_html(value)


def parse_rss_feed_fallback(xml_text: str, source_url: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for block in re.findall(r"<item\b.*?</item>", xml_text, flags=re.IGNORECASE | re.DOTALL):
        title = extract_tag(block, "title")
        link = extract_tag(block, "link")
        description = extract_tag(block, "description")
        published = extract_tag(block, "pubDate")
        guid = extract_tag(block, "guid") or link or title
        if not title and not description:
            continue
        items.append(
            {
                "id": guid,
                "source_url": source_url,
                "title": title,
                "description": description,
                "link": link,
                "published_at": published,
                "fetched_at": now_iso(),
            }
        )
    return items


def parse_rss_feed(xml_bytes: bytes, source_url: str) -> list[dict[str, Any]]:
    try:
        root = ET.fromstring(xml_bytes)
        items: list[dict[str, Any]] = []
        for item in root.findall(".//item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            description = strip_html(item.findtext("description") or "")
            published = (item.findtext("pubDate") or "").strip()
            guid = (item.findtext("guid") or link or title).strip()
            if not title and not description:
                continue
            items.append(
                {
                    "id": guid,
                    "source_url": source_url,
                    "title": title,
                    "description": description,
                    "link": link,
                    "published_at": published,
                    "fetched_at": now_iso(),
                }
            )
        return items
    except ET.ParseError:
        return parse_rss_feed_fallback(xml_bytes.decode("utf-8", "ignore"), source_url)


def fetch_rss_items(config: CityConfig, headers: dict[str, str]) -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    for feed_url in config.news_source_urls:
        try:
            xml_bytes = request_bytes(feed_url, headers=headers)
            parsed_items = parse_rss_feed(xml_bytes, feed_url)
            collected.extend(parsed_items)
            print(f"INFO [FETCH] {feed_url} -> {len(parsed_items)} items")
        except urllib.error.HTTPError as exc:
            print(f"ERROR [HTTP] {feed_url} -> {exc.code} {exc.reason}")
        except urllib.error.URLError as exc:
            print(f"ERROR [NETWORK] {feed_url} -> {exc}")
        except Exception as exc:
            print(f"ERROR [FETCH_UNKNOWN] {feed_url} -> {type(exc).__name__}: {exc}")
    return collected


def absolute_url(base_url: str, path_or_url: str) -> str:
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url
    return f"{base_url}{path_or_url}"


def extract_meta_description(html_text: str) -> str:
    for pattern in (
        r'<meta name="description" content="([^"]+)"',
        r'<meta property="og:description" content="([^"]+)"',
    ):
        match = re.search(pattern, html_text, flags=re.IGNORECASE | re.DOTALL)
        if match:
            return strip_html(match.group(1))
    return ""


def fetch_los_angeles_press_items(config: CityConfig, headers: dict[str, str]) -> list[dict[str, Any]]:
    press_url = config.news_source_urls[0]
    try:
        html_text = request_bytes(press_url, headers=headers).decode("utf-8", "ignore")
    except urllib.error.HTTPError as exc:
        print(f"ERROR [HTTP] {press_url} -> {exc.code} {exc.reason}")
        return []
    except urllib.error.URLError as exc:
        print(f"ERROR [NETWORK] {press_url} -> {exc}")
        return []

    blocks = re.findall(
        r'<div class="article row my-3">(.*?)</div>\s*</div>\s*</span></div></li>',
        html_text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    items: list[dict[str, Any]] = []
    seen_links: set[str] = set()

    for block in blocks:
        link_match = re.search(r'<a class="h4" href="([^"]+)"', block, flags=re.IGNORECASE)
        title_match = re.search(r'<a class="h4"[^>]*>(.*?)</a>', block, flags=re.IGNORECASE | re.DOTALL)
        date_match = re.search(r"<small>(.*?)</small>", block, flags=re.IGNORECASE | re.DOTALL)
        if not link_match or not title_match:
            continue

        link = absolute_url("https://mayor.lacity.gov", link_match.group(1).strip())
        if link in seen_links:
            continue

        title = strip_html(title_match.group(1))
        published_at = strip_html(date_match.group(1)) if date_match else ""
        description = ""

        try:
            article_html = request_bytes(link, headers=headers, timeout=12).decode("utf-8", "ignore")
            description = extract_meta_description(article_html)
        except Exception:
            description = ""

        items.append(
            {
                "id": link,
                "source_url": press_url,
                "title": title,
                "description": description,
                "link": link,
                "published_at": published_at,
                "fetched_at": now_iso(),
            }
        )
        seen_links.add(link)

    print(f"INFO [FETCH] {press_url} -> {len(items)} items")
    return items


def fetch_news_items(config: CityConfig, headers: dict[str, str]) -> list[dict[str, Any]]:
    if config.news_source_kind == "rss":
        return fetch_rss_items(config, headers)
    if config.news_source_kind == "la_press_html":
        return fetch_los_angeles_press_items(config, headers)
    raise ValueError(f"Unsupported news source kind: {config.news_source_kind}")


CHICAGO_CONFIG = CityConfig(
    slug="chicago",
    city="Chicago",
    state="Illinois",
    output_filename="chicagogov.json",
    api_key_id_env="CHICAGO_API_KEY_ID",
    api_key_id_default="5qgmj35xmxssjs8chg6um5wgf",
    api_key_secret_env="CHICAGO_API_KEY_SECRET",
    api_key_secret_default="1th8cv2fzzubsb0mb0cpwpzfihi0k5b7wjtl94j4gdokjcm9xn",
    geography_type_area="ward",
    geography_type_neighborhood="community_area",
    area_source=GeographySourceConfig(
        label="Chicago Wards",
        source_type="socrata",
        url="https://data.cityofchicago.org/resource/p293-wvbd.json?$select=ward",
        field="ward",
        prefix="Ward ",
    ),
    neighborhood_source=GeographySourceConfig(
        label="Chicago Community Areas",
        source_type="socrata",
        url="https://data.cityofchicago.org/resource/igwz-8jzy.json?$select=community",
        field="community",
    ),
    news_source_kind="rss",
    news_source_urls=(
        "https://feeds.feedburner.com/CityOfChicagoPressReleasesStatements",
        "https://feeds.feedburner.com/CityOfChicagoResidentUpdates",
    ),
    keyword_hints=tuple(sorted(BASE_KEYWORDS)),
    user_agent_label="chicagogov-monitor",
)


DALLAS_CONFIG = CityConfig(
    slug="dallas",
    city="Dallas",
    state="Texas",
    output_filename="dallasgov.json",
    api_key_id_env="DALLAS_API_KEY_ID",
    api_key_id_default="ca24avj74h898ogasz7zfn6w8",
    api_key_secret_env="DALLAS_API_KEY_SECRET",
    api_key_secret_default="65uom6uwswmgcc7g9gwj80qmeu88rr0klmmsxzfw7jjhrhad8r",
    geography_type_area="council_district",
    geography_type_neighborhood="neighborhood_association",
    area_source=GeographySourceConfig(
        label="Dallas Council Districts",
        source_type="arcgis",
        url=(
            "https://services2.arcgis.com/rwnOSbfKSwyTBcwN/arcgis/rest/services/"
            "CouncilBoundaries/FeatureServer/0/query?where=1%3D1&outFields=DISTRICT&"
            "returnGeometry=false&f=pjson"
        ),
        field="DISTRICT",
        prefix="Council District ",
    ),
    neighborhood_source=GeographySourceConfig(
        label="Dallas Neighborhood Associations",
        source_type="arcgis",
        url=(
            "https://services2.arcgis.com/rwnOSbfKSwyTBcwN/arcgis/rest/services/"
            "NeighborhoodAssociations/FeatureServer/0/query?where=1%3D1&outFields=ASSO_NAME&"
            "returnGeometry=false&f=pjson"
        ),
        field="ASSO_NAME",
    ),
    news_source_kind="rss",
    news_source_urls=(
        "https://www.dallascitynews.net/feed",
        "https://www.dallascitynews.net/topics/citynews/feed",
    ),
    keyword_hints=tuple(sorted(BASE_KEYWORDS | {"community park", "public improvement", "district"})),
    user_agent_label="dallasgov-monitor",
)


LOS_ANGELES_CONFIG = CityConfig(
    slug="losangeles",
    city="Los Angeles",
    state="California",
    output_filename="losangelesgov.json",
    api_key_id_env="LOS_ANGELES_API_KEY_ID",
    api_key_id_default="7avw4mhlmmmsypt3grqt8az35",
    api_key_secret_env="LOS_ANGELES_API_KEY_SECRET",
    api_key_secret_default="20qyigmayyj17ddpqwji2l509ts0952zcbehqmb74h8dn0bwqv",
    geography_type_area="community_plan_area",
    geography_type_neighborhood="neighborhood_council",
    area_source=GeographySourceConfig(
        label="Los Angeles Community Plan Areas",
        source_type="arcgis",
        url=(
            "https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/9/query?"
            "where=1%3D1&outFields=NAME&returnGeometry=false&f=pjson"
        ),
        field="NAME",
    ),
    neighborhood_source=GeographySourceConfig(
        label="Los Angeles Neighborhood Councils",
        source_type="arcgis",
        url=(
            "https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/18/query?"
            "where=1%3D1&outFields=NAME&returnGeometry=false&f=pjson"
        ),
        field="NAME",
    ),
    news_source_kind="la_press_html",
    news_source_urls=("https://mayor.lacity.gov/press",),
    keyword_hints=tuple(sorted(BASE_KEYWORDS | {"bridge", "port", "airport", "transit", "downtown"})),
    user_agent_label="losangelesgov-monitor",
)


NYC_CONFIG = CityConfig(
    slug="nyc",
    city="New York City",
    state="New York",
    output_filename="nycgov.json",
    api_key_id_env="NYC_API_KEY_ID",
    api_key_id_default="anqghva9ry9yj1l10ybsnp9uz",
    api_key_secret_env="NYC_API_KEY_SECRET",
    api_key_secret_default="6zexaohc3vajx4nh7q27qpck41sw2zer20dbnlg61v2r78wvr",
    geography_type_area="borough",
    geography_type_neighborhood="nta",
    area_source=GeographySourceConfig(
        label="NYC Boroughs",
        source_type="socrata",
        url="https://data.cityofnewyork.us/resource/gthc-hcne.json?$select=boroname",
        field="boroname",
    ),
    neighborhood_source=GeographySourceConfig(
        label="NYC Neighborhood Tabulation Areas",
        source_type="socrata",
        url="https://data.cityofnewyork.us/resource/9nt8-h7nd.json?$select=ntaname",
        field="ntaname",
    ),
    news_source_kind="rss",
    news_source_urls=("https://www.nyc.gov/assets/planning/rss/press_releases_rss.xml",),
    keyword_hints=tuple(sorted(BASE_KEYWORDS | {"city planning", "carbon neutrality", "resiliency"})),
    user_agent_label="nycgov-monitor",
)

