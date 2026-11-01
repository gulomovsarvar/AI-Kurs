#!/usr/bin/env python3
"""Поиск и скачивание музыки и звуков через Openverse API (без ключа, анонимно).

  openverse_audio.py "calm ambient" --music --min 60 --license cc0,by
  openverse_audio.py "whoosh" --get 3 --out ./sfx

Ответ API медленный и рвётся: каждый запрос повторяется до RETRIES раз.
Рядом со скачанным файлом пишется ATTRIBUTION.txt: для CC BY автор и ссылка обязательны в подписи к ролику.
"""
import argparse, json, sys, time, urllib.parse, urllib.request
from pathlib import Path

API = "https://api.openverse.org/v1/audio/"
RETRIES, TIMEOUT = 4, 90
MUSIC_SOURCES = "jamendo,ccmixter,wikimedia_audio"

def fetch(url: str) -> bytes:
    last = None
    for i in range(RETRIES):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "openverse-audio-cli/1.0"}), timeout=TIMEOUT) as r:
                return r.read()
        except Exception as e:  # сеть или 5xx: ждём и пробуем снова
            last = e; time.sleep(3 * (i + 1))
    raise SystemExit(f"Openverse не ответил за {RETRIES} попытки: {last}")

def search(q, license_, music, min_s, max_s, n):
    params = {"q": q, "license": license_, "page_size": max(n * 3, 20)}
    if music: params["source"] = MUSIC_SOURCES
    rows = json.loads(fetch(API + "?" + urllib.parse.urlencode(params)))["results"]
    ok = [r for r in rows if r.get("duration") and min_s * 1000 <= r["duration"] <= max_s * 1000]
    return ok[:n]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query"); ap.add_argument("--license", default="cc0,pdm,by")
    ap.add_argument("--music", action="store_true", help="только музыкальные источники")
    ap.add_argument("--min", type=int, default=0); ap.add_argument("--max", type=int, default=600)
    ap.add_argument("-n", type=int, default=10); ap.add_argument("--get", type=int, default=0, help="скачать первые N")
    ap.add_argument("--out", default=".")
    a = ap.parse_args()
    rows = search(a.query, a.license, a.music, a.min, a.max, max(a.n, a.get))
    for i, r in enumerate(rows):
        print(f"{i+1:2}. [{r['license']}] {r['duration']//1000:4}s  {r['title'][:50]}  · {r.get('creator') or '?'} · {r['source']}")
    if not a.get: return
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True); credits = []
    for r in rows[:a.get]:
        ext = r.get("filetype") or "mp3"
        name = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in r["title"])[:50] + f".{ext}"
        (out / name).write_bytes(fetch(r["url"]))
        credits.append(f"{name}: «{r['title']}» · {r.get('creator') or '?'} · {r['license'].upper()} {r.get('license_version') or ''} · {r.get('foreign_landing_url') or r['url']}")
        print("скачано:", out / name)
    with open(out / "ATTRIBUTION.txt", "a", encoding="utf-8") as f: f.write("\n".join(credits) + "\n")

if __name__ == "__main__":
    main()
