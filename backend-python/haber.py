import json
import os
import sys

# .env dosyasından environment variable'larını yükle
from dotenv import load_dotenv
load_dotenv()

# VS Code / farklı Python kullanımında paket hatası verirse bu mesaj çıkar
try:
    import requests  # type: ignore[import-untyped]
    import openai  # type: ignore[import-untyped]
except ImportError as e:
    print("ERROR [IMPORT] Missing package:", e)
    print("Fix: In VS Code open Terminal (Ctrl+`) and run:")
    print("     pip install -r requirements.txt")
    print("If it still fails: Ctrl+Shift+P -> 'Python: Select Interpreter' -> same Python as terminal, then run pip again.")
    sys.exit(1)

import time
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

# API Keys: environment variable'lardan oku (asla kodda key'i commit etme!)
MARKETAUX_TOKEN = os.environ.get("MARKETAUX_TOKEN", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
_openai_client = openai.OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

NEWS_JSON_PATH = "news.json"
POLL_INTERVAL_SECONDS = 60  # kaç saniyede bir yeni haber bakılacak
SERVER_PORT = 8080  # haberlerin sunulduğu port (news.json bu porttan erişilir)

marketaux_url = (
    f"https://api.marketaux.com/v1/news/all"
    f"?symbols=TSLA,AMZN,MSFT"
    f"&filter_entities=true"
    f"&language=en"
    f"&api_token={MARKETAUX_TOKEN}"
)


def load_existing_news():
    """Load existing items from news.json so we do not duplicate titles."""
    try:
        with open(NEWS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            print("ERROR [FILE_FORMAT] news.json is not a list; starting with empty list.")
            return []
        return data
    except FileNotFoundError:
        # First run, file does not exist
        return []
    except Exception as e:
        print(f"ERROR [FILE_READ] Cannot read {NEWS_JSON_PATH}: {e}")
        return []


def fetch_news():
    """Fetch latest news from Marketaux API."""
    try:
        resp = requests.get(marketaux_url, timeout=15)
    except requests.RequestException as e:
        print(f"ERROR [NETWORK] Failed to fetch news: {e}")
        return None

    if resp.status_code != 200:
        print(f"ERROR [MARKETAUX_API] Status {resp.status_code} - {resp.text}")
        return None

    try:
        data = resp.json()
    except ValueError as e:
        print(f"ERROR [JSON_PARSE] Invalid response from news API: {e}")
        return None

    news_list = data.get("data", [])
    if not news_list:
        print("ERROR [NO_DATA] No news items returned from API.")
        return []

    return news_list


SYSTEM_PROMPT = (
    "Sen Nexus projesinin yapay zeka tabanlı finansal strateji uzmanısın. Görevin, kullanıcılara geleneksel hisse senetleri ile tokenize edilmiş gerçek dünya varlıkları (gayrimenkul, araç filosu, enerji altyapısı) arasında köprü kuran profesyonel analizler sunmaktır. BlackRock'ın Aladdin modelinden ilham alan bir risk yönetimi yaklaşımı benimse. Her tavsiyende bir 'Risk Skoru' (0-100) belirt. INGILIZCE YAZ, kısa (max ~250 karakter). Sonunda alınabilirlik koy: çok alınır / az alınır / alınmaz / kesin fırsat veya sat alarmı vb."
)


def analyze_with_openai(description: str) -> str:
    """Get AI financial comment (OpenAI SDK 1.x). Hata olursa konsola tam mesaj yazılır."""
    if not _openai_client:
        return "[Analysis skipped: no API key]"
    try:
        response = _openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": description[:4000]},  # token sınırı için kısalt
            ],
        )
        msg = response.choices[0].message
        out = (msg.content or "").strip()
        return out if out else "[No analysis returned]"
    except Exception as e:
        err_name = type(e).__name__
        err_msg = str(e)
        # Gerçek hatayı her zaman konsola yaz (API key invalid, quota, vs.)
        print(f"ERROR [OPENAI] {err_name}: {err_msg}")
        if "RateLimit" in err_name or "rate_limit" in err_msg.lower():
            return "[Analysis skipped: rate limit]"
        if "Authentication" in err_name or "invalid" in err_msg.lower() or "401" in err_msg:
            print("  -> Çözüm: Geçerli bir OpenAI API key kullan. https://platform.openai.com/api-keys")
            return "[Analysis failed: invalid or expired API key]"
        if "quota" in err_msg.lower() or "insufficient" in err_msg.lower():
            return "[Analysis failed: quota exceeded]"
        if "API" in err_name or "api" in err_msg.lower():
            return "[Analysis failed: API error]"
        if "Connection" in err_name or "connection" in err_msg.lower():
            return "[Analysis failed: connection error]"
        return "[Analysis failed]"


def save_news(all_items):
    """Persist all collected items to news.json."""
    try:
        with open(NEWS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
        print(f"SUCCESS [WRITE] {len(all_items)} items saved to {NEWS_JSON_PATH}")
    except OSError as e:
        print(f"ERROR [FILE_WRITE] Cannot write {NEWS_JSON_PATH}: {e}")


class NewsHandler(BaseHTTPRequestHandler):
    """Serves news.json on GET / or GET /news.json"""
    def do_GET(self):
        if self.path in ("/", "/news.json"):
            try:
                with open(NEWS_JSON_PATH, "r", encoding="utf-8") as f:
                    body = f.read().encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except FileNotFoundError:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"[]")
            except OSError as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # isteğe bağlı: log'u kapatmak için


def run_server():
    server = HTTPServer(("0.0.0.0", SERVER_PORT), NewsHandler)
    print(f"INFO [SERVER] News API listening on port {SERVER_PORT} (http://localhost:{SERVER_PORT}/news.json)")
    server.serve_forever()


def main():
    # Load existing entries so we keep history and avoid duplicates across restarts
    all_items = load_existing_news()
    known_titles = {item.get("title") for item in all_items if isinstance(item, dict)}
    print(f"INFO [START] Loaded {len(all_items)} existing items. Poll interval: {POLL_INTERVAL_SECONDS}s")

    while True:
        news_list = fetch_news()
        if news_list is None:
            # Hard error, wait and retry
            time.sleep(POLL_INTERVAL_SECONDS)
            continue

        new_count = 0

        for news in news_list:
            title = news.get("title", "No title")
            description = news.get("description", "No description")

            # Skip already seen titles (during this run or previous ones)
            if title in known_titles:
                continue

            ai_comment = analyze_with_openai(description)

            all_items.append(
                {
                    "title": title,
                    "description": description,
                    "ai_comment": ai_comment,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }
            )
            known_titles.add(title)
            new_count += 1

            # small delay between OpenAI calls
            time.sleep(1)

        if new_count > 0:
            save_news(all_items)
            print(f"INFO [CYCLE] Added {new_count} new items.")
        else:
            print("INFO [CYCLE] No new unique news items.")

        # wait before next poll
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    try:
        main()
    except KeyboardInterrupt:
        print("INFO [SHUTDOWN] Stopped by user.")
