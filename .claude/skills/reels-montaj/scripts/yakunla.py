"""Renderdan keyingi umumiy yakun: ovoz -14 LUFS (2 o'tishli loudnorm), video -crf 21 (Telegram uchun < 50 MB).

    python yakunla.py --kirish montaj\\export\\raw.mp4 --chiqish tayyor\\video.mp4

Oxirida natijaning haqiqiy LUFS qiymatini o'lchab chiqaradi.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

TARGET = {"I": -14.0, "TP": -1.5, "LRA": 11.0}


def measure(path: Path) -> dict:
    af = f"loudnorm=I={TARGET['I']}:TP={TARGET['TP']}:LRA={TARGET['LRA']}:print_format=json"
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", af, "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    if not m:
        raise SystemExit("loudnorm o'lchovi topilmadi (videoda ovoz bormi?)")
    return json.loads(m.group(0))


def lufs(path: Path) -> str:
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", err)
    return m[-1] if m else "?"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kirish", required=True)
    ap.add_argument("--chiqish", required=True)
    ap.add_argument("--crf", default="21")
    a = ap.parse_args()
    src, dst = Path(a.kirish), Path(a.chiqish)
    dst.parent.mkdir(parents=True, exist_ok=True)

    m = measure(src)  # 1-o'tish
    print(f"[yakunla] kirish: {m['input_i']} LUFS, TP {m['input_tp']}")
    if float(m["input_i"]) < -60:  # deyarli jim (masalan, test) — normallashtirib bo'lmaydi
        af = "anull"
    else:
        af = (f"loudnorm=I={TARGET['I']}:TP={TARGET['TP']}:LRA={TARGET['LRA']}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", str(src), "-af", af,
                    "-c:v", "libx264", "-crf", a.crf, "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", str(dst)], check=True)  # 2-o'tish
    mb = dst.stat().st_size / 1e6
    print(f"[yakunla] {dst}: {mb:.1f} MB, natija {lufs(dst)} LUFS" + ("  (DIQQAT: 50 MB dan katta)" if mb > 50 else ""))


if __name__ == "__main__":
    main()
