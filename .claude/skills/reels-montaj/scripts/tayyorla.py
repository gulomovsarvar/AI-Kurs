"""Ikkala format uchun umumiy tayyorlov: rang, o'lcham, transkripsiya, subtitr bo'laklari, meta.json.

    .venv\\Scripts\\python tayyorla.py --kirish xom\\video.mp4 --loyiha montaj [--ekran xom\\ekran.mp4] [--til uz] [--models models]

Nima qiladi:
1. ffprobe: davomiylik, o'lcham, fps, rang (HLG/HDR?).
2. Spiker videosi -> <loyiha>/public/talk.mp4: 1080x1920, 30 fps, SDR (iPhone HLG bo'lsa tonemap), markazdan kroplab.
3. Ekran yozuvi (ixtiyoriy) -> public/tut.mp4: 30 fps, o'lchami saqlanadi.
4. Ovoz -> qa/src.wav (16 kHz mono) -> words.py (NavaiSTT) -> qa/words.json.
5. So'zlarni tozalash (apostrof -> ʻ, brendlar) va 3 so'zli bo'laklar -> public/captions.json.
6. public/meta.json: davomiylik va fayllar. Remotion shu fayldan kompozitsiya uzunligini hisoblaydi.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BRENDLAR = {"klod": "Claude", "cloud": "Claude", "klaud": "Claude", "rav": "RAW", "remoshn": "Remotion"}
OKINA = "ʻ"  # ʻ
# Remotion OffthreadVideo aniq kadr topishi uchun: B-kadrsiz, har 1 s da kalit kadr
SEEK = ["-bf", "0", "-g", "30", "-keyint_min", "30", "-movflags", "+faststart"]


def run(cmd: list, **kw):
    print("$", " ".join(str(c) for c in cmd)[:200])
    r = subprocess.run([str(c) for c in cmd], **kw)
    if r.returncode != 0:
        raise SystemExit(f"Xato: {cmd[0]} kodi {r.returncode}")
    return r


def probe(path: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(path)], capture_output=True, text=True).stdout
    d = json.loads(out)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    rot = 0
    for sd in v.get("side_data_list", []):
        rot = int(sd.get("rotation", 0) or 0) or rot
    w, h = v["width"], v["height"]
    if abs(rot) in (90, 270):
        w, h = h, w
    return {
        "duration": float(d["format"]["duration"]),
        "w": w, "h": h,
        "hlg": v.get("color_transfer") in ("arib-std-b67", "smpte2084"),
        "audio": any(s["codec_type"] == "audio" for s in d["streams"]),
    }


def talk_filter(info: dict) -> str:
    # 9:16 ga markazdan kroplash, keyin 1080x1920
    crop = "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'"
    fit = f"{crop},scale=1080:1920:flags=lanczos,setsar=1,fps=30"
    if info["hlg"]:
        tone = ("zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
                "tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
        return f"{tone},{fit}"
    return f"{fit},format=yuv420p"


def clean_words(raw: list) -> list:
    words = []
    for s, e, w in raw:
        w = w.replace("'", OKINA).replace("‘", OKINA).replace("`", OKINA).replace("’", OKINA)
        # apostrof bilan boshlangan token oldingi so'zga yopishtiriladi: o + ʻrgat -> oʻrgat
        if words and w.startswith(OKINA):
            words[-1]["t"] += w
            words[-1]["e"] = e
            continue
        key = re.sub(r"[^\w]", "", w.lower())
        if key in BRENDLAR:
            w = re.sub(re.escape(key), BRENDLAR[key], w, flags=re.I)
        words.append({"t": w, "s": s, "e": e})
    # o'g' / g' harflarini to'g'rilash: o' -> oʻ, g' -> gʻ (agar hali ' qolgan bo'lsa)
    for x in words:
        x["t"] = re.sub(r"([oOgG])'", r"\1" + OKINA, x["t"])
    return words


def chunk(words: list, size: int = 3, gap: float = 0.35) -> list:
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        brk = len(cur) >= size or re.search(r"[.,!?;:…]$", w["t"]) or (nxt and nxt["s"] - w["e"] > gap)
        if brk or nxt is None:
            out.append(cur)
            cur = []
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kirish", required=True, help="spiker videosi")
    ap.add_argument("--loyiha", required=True, help="Remotion loyiha papkasi (montaj)")
    ap.add_argument("--ekran", help="ekran yozuvi (tutorial uchun)")
    ap.add_argument("--til", default="uz")
    ap.add_argument("--models", default="models")
    ap.add_argument("--subtitrsiz", action="store_true", help="transkripsiyani o'tkazib yuborish")
    a = ap.parse_args()

    src = Path(a.kirish).resolve()
    proj = Path(a.loyiha).resolve()
    pub, qa = proj / "public", proj / "qa"
    pub.mkdir(parents=True, exist_ok=True)
    qa.mkdir(parents=True, exist_ok=True)

    info = probe(src)
    print(f"[tayyorla] {src.name}: {info['w']}x{info['h']}, {info['duration']:.2f} s, HLG={info['hlg']}, audio={info['audio']}")

    # 1-2. Spiker videosi
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", src, "-vf", talk_filter(info),
         "-c:v", "libx264", "-crf", "17", "-preset", "medium", *SEEK, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", pub / "talk.mp4"])
    talk = probe(pub / "talk.mp4")
    meta = {"duration": round(talk["duration"], 3), "talk": "talk.mp4"}

    # 3. Ekran yozuvi
    if a.ekran:
        e = Path(a.ekran).resolve()
        run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", e, "-vf", "fps=30,format=yuv420p", "-an", "-c:v", "libx264", "-crf", "18", *SEEK, pub / "tut.mp4"])
        ti = probe(pub / "tut.mp4")
        meta["tut"] = {"file": "tut.mp4", "w": ti["w"], "h": ti["h"], "duration": round(ti["duration"], 3)}

    # 4-5. Transkripsiya
    captions = []
    if info["audio"] and not a.subtitrsiz:
        run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", pub / "talk.mp4", "-vn", "-ac", "1", "-ar", "16000", qa / "src.wav"])
        run([sys.executable, HERE / "words.py", qa / "src.wav", qa / "words.json", "--models", Path(a.models).resolve(), "--til", a.til])
        raw = json.loads((qa / "words.json").read_text(encoding="utf-8"))
        captions = chunk(clean_words(raw))
    (pub / "captions.json").write_text(json.dumps(captions, ensure_ascii=False), encoding="utf-8")

    # 6. Meta
    (pub / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    (pub / "sfx").mkdir(exist_ok=True)
    print(f"[tayyorla] tayyor: {meta['duration']} s, {sum(len(c) for c in captions)} so'z, {len(captions)} bo'lak -> {pub}")


if __name__ == "__main__":
    main()
