"""D:\\motion uchun papkasini inventarizatsiya qiladi -> motion/KATALOG.md va motion/katalog.json.

Ishga tushirish (loyiha ildizidan):
    python motion/katalog.py "D:/motion uchun"

Asl fayllarga tegmaydi: faqat o'qiydi (ffprobe bilan davomiylik oladi).
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

AUDIO = {".wav", ".mp3", ".m4a", ".aac", ".ogg", ".flac"}
VIDEO = {".mp4", ".mov", ".m4v", ".webm"}
RASM = {".jpg", ".jpeg", ".png", ".webp"}

# Papka nomi (katta-kichik harf farqsiz) -> SFX roli
ROL = [
    ("whoosh", "whoosh"), ("woosh", "whoosh"),
    ("pops", "pop"), ("bubbles", "pop"),
    ("ui buttons", "click"), ("uis", "click"),
    ("typing", "typing"), ("clock", "tick"), ("risers", "riser"),
    ("glitch", "glitch"), ("camera", "camera"), ("paper", "paper"),
    ("tone", "tone"), ("music", "musiqa"), ("nature", "tabiat"),
    ("stress", "stress"),
]
# Media papkalar -> vazifasi
MEDIA = {
    "reels_reference": "reference (uslub namunasi, montajga qo'yilmaydi)",
    "aplication_reference": "reference (ilova/UI namunasi)",
    "eskiz_video": "B-roll nomzodi",
    "sarpo": "B-roll nomzodi (rasm)",
}
ROL_TAVSIF = {
    "whoosh": "sahna/qadam almashganda", "pop": "matn yoki kartochka paydo bo'lganda",
    "click": "tugma, kursor, obuna tugmasi", "typing": "matn yozilayotganda",
    "tick": "raqam hisoblagich, soat", "riser": "kulminatsiyadan oldin",
    "glitch": "keskin o'tish", "camera": "suratga olish, punch-in",
    "paper": "qog'oz/varaq", "tone": "urg'u tovushi", "musiqa": "fon musiqasi",
}


def rol_top(p: Path) -> str:
    for part in reversed([x.lower() for x in p.parts]):
        for kalit, rol in ROL:
            if kalit in part:
                return rol
    return "boshqa"


def probe(p: Path) -> dict:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(p)],
            capture_output=True, text=True, timeout=30,
        ).stdout
        d = json.loads(out or "{}")
    except Exception:
        d = {}
    st = d.get("streams", [])
    v = next((s for s in st if s.get("codec_type") == "video" and s.get("disposition", {}).get("attached_pic") != 1), None)
    return {
        "dur": round(float(d.get("format", {}).get("duration", 0) or 0), 2),
        "audio": any(s.get("codec_type") == "audio" for s in st),
        "wh": f"{v['width']}x{v['height']}" if v else "",
    }


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "D:/motion uchun")
    out_dir = Path(__file__).resolve().parent
    # B-roll mazmuni qo'lda yoziladi (ko'z bilan ko'rib): fayl nomi yoki papka nomi -> tavsif
    tf = out_dir / "broll_tavsif.json"
    tavsif = json.loads(tf.read_text(encoding="utf-8")) if tf.exists() else {}
    fayllar = [p for p in root.rglob("*") if p.is_file() and p.name != ".DS_Store"]
    with ThreadPoolExecutor(8) as ex:
        info = dict(zip(fayllar, ex.map(lambda p: probe(p) if p.suffix.lower() in AUDIO | VIDEO else {}, fayllar)))

    sfx, media = [], []
    for p in sorted(fayllar):
        rel = p.relative_to(root)
        ext = p.suffix.lower()
        top = rel.parts[0].lower()
        i = info[p]
        if top == "sfx" and (ext in AUDIO or ext in VIDEO):
            if ext in VIDEO and not i.get("audio"):
                continue
            sfx.append({"rol": rol_top(rel), "fayl": p.name, "yol": str(p).replace("\\", "/"), "dur": i["dur"],
                        "litsenziya": "Epidemic Sound (obuna kerak)" if p.name.startswith("ES_") else "noma'lum"})
        elif ext in VIDEO | RASM:
            media.append({"vazifa": MEDIA.get(top, "boshqa"), "fayl": p.name, "yol": str(p).replace("\\", "/"),
                          "tur": "video" if ext in VIDEO else "rasm", "dur": i.get("dur", 0), "olcham": i.get("wh", ""),
                          "tavsif": tavsif.get(p.name) or tavsif.get(rel.parts[0], "")})

    (out_dir / "katalog.json").write_text(json.dumps({"manba": str(root), "sfx": sfx, "media": media}, ensure_ascii=False, indent=1), encoding="utf-8")

    L = ["# KATALOG: D:\\motion uchun", "",
         f"Avtomatik yaratilgan: `python motion/katalog.py \"{root.as_posix()}\"`. Qo'lda tahrirlamang, qayta ishga tushiring.",
         "Mashina uchun versiyasi: `motion/katalog.json`. Asl fayllar joyida qoladi; montajda kerakligi `montaj/public/sfx/` ga nusxalanadi.", "",
         "## SFX rollari", "", "| Rol | Qachon | Soni | Tavsiya (eng qisqa 3 ta, <2 s) |", "|---|---|---|---|"]
    rollar = sorted({s["rol"] for s in sfx}, key=lambda r: -sum(1 for s in sfx if s["rol"] == r))
    for r in rollar:
        g = sorted([s for s in sfx if s["rol"] == r], key=lambda s: s["dur"])
        top3 = ", ".join(f"`{s['fayl']}` ({s['dur']} s)" for s in [s for s in g if 0 < s["dur"] < 2][:3])
        L.append(f"| {r} | {ROL_TAVSIF.get(r, '—')} | {len(g)} | {top3 or '—'} |")
    L += ["", f"Jami SFX: {len(sfx)}. `ES_` bilan boshlanganlar Epidemic Sound'dan — obunasiz tijoriy ishlatmang.", "",
          "## B-roll va reference media", "",
          "Montajda avval shu ro'yxatdan mazmuni mos B-roll tanlanadi; grafik B-roll faqat zaxira. Tavsiflar: `motion/broll_tavsif.json`.", "",
          "| Vazifa | Fayl | Tur | Davomiylik | O'lcham | Mazmuni |", "|---|---|---|---|---|---|"]
    for m in media:
        L.append(f"| {m['vazifa']} | `{m['fayl']}` | {m['tur']} | {m['dur'] or '—'} | {m['olcham'] or '—'} | {m['tavsif'] or '—'} |")
    L += ["", "## To'liq SFX ro'yxati", ""]
    for r in rollar:
        L += [f"### {r}", "", "| Fayl | Davomiylik, s | Yo'l |", "|---|---|---|"]
        for s in sorted([s for s in sfx if s["rol"] == r], key=lambda s: s["dur"]):
            L.append(f"| {s['fayl']} | {s['dur']} | `{s['yol']}` |")
        L.append("")
    (out_dir / "KATALOG.md").write_text("\n".join(L), encoding="utf-8")
    print(f"SFX: {len(sfx)}, media: {len(media)} -> {out_dir / 'KATALOG.md'}")
    for r in rollar:
        print(f"  {r}: {sum(1 for s in sfx if s['rol'] == r)}")


if __name__ == "__main__":
    main()
