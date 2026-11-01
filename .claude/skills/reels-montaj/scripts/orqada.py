"""'orqada' effekti uchun odamni fondan ajratish (RobustVideoMatting, ONNX).

    .venv\\Scripts\\python orqada.py --loyiha montaj [--models models] [--downsample 0.25]

- plan.json dagi faqat "type": "orqada" oraliqlari hisoblanadi (butun video emas).
- Har oraliqdan WARM s oldin boshlanadi: RVM rekurrent model, oldingi kadrlar konturni barqarorlashtiradi.
- Natija: public/orqada/<kalit>/0001.png... (RGBA: fgr + alfa), kalit = talk.mp4 mazmuni + oraliq + model.
  Papka bor bo'lsa — keshdan olinadi, qayta hisoblanmaydi.
- Niqobdan bosh tepasi va yelka chizig'i topiladi -> public/orqada.json (Remotion so'zni shu balandlikka qo'yadi).
- CUDA bo'lsa CUDAExecutionProvider, bo'lmasa CPU.
"""
import argparse
import hashlib
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np

MODEL = "rvm_mobilenetv3_fp32.onnx"
MODEL_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/" + MODEL
VERSION = "2"  # kesh formatini o'zgartirsang oshir
WARM = 0.5  # s, oraliqdan oldin "isinish"
FPS = 30
W, H = 1080, 1920


def file_sha(p: Path) -> str:
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def session(model_path: Path):
    import onnxruntime as ort

    avail = ort.get_available_providers()
    if "CUDAExecutionProvider" in avail:
        try:
            s = ort.InferenceSession(str(model_path), providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
            if "CUDAExecutionProvider" in s.get_providers():
                return s, "cuda"
        except Exception as e:
            print(f"[orqada] CUDA ishlamadi ({str(e)[:100]}), CPU ga o'tildi", file=sys.stderr)
    return ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"]), "cpu"


def frames(talk: Path, start: float, n: int):
    """talk.mp4 dan start soniyadan n ta kadr (RGB uint8, HxWx3)."""
    p = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", str(talk), "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    size = W * H * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    p.wait()


def head_shoulders(alpha: np.ndarray):
    """Niqobdan bosh tepasi, yelka chizig'i va markaz x. alpha: HxW float 0..1."""
    m = alpha > 0.5
    widths = m.sum(1)
    rows = np.where(widths > 6)[0]
    if len(rows) == 0:
        return None
    top = int(rows[0])
    # bosh eni: tepadan 40–90 px pastdagi qatorlar medianasi
    hw = float(np.median(widths[top + 40 : top + 90])) if top + 90 < H else float(widths[top:].max())
    hw = max(hw, 20.0)
    # yelka: boshdan kamida 1 bosh eni pastda, qator eni bosh enidan 1.9 marta katta bo'lgan birinchi joy
    start = int(top + hw)
    sh = next((y for y in range(start, min(H, top + int(hw * 5))) if widths[y] > hw * 1.9), int(top + hw * 2.2))
    xs = np.where(m[top : sh].any(0))[0]
    cx = float(xs.mean()) if len(xs) else W / 2
    return top, int(sh), cx, hw


def process(sess, talk: Path, item: dict, out_dir: Path, ds: float):
    at, out = float(item["at"]), float(item["out"])
    start = max(0.0, at - WARM)
    n_total = int(round((out - start) * FPS)) + 1
    skip = int(round((at - start) * FPS))  # isinish kadrlari yozilmaydi
    out_dir.mkdir(parents=True, exist_ok=True)
    rec = [np.zeros((1, 1, 1, 1), np.float32)] * 4
    dsr = np.array([ds], np.float32)
    png = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-start_number", "1", str(out_dir / "%04d.png")],
        stdin=subprocess.PIPE,
    )
    geo, written = [], 0
    for i, rgb in enumerate(frames(talk, start, n_total)):
        src = (rgb.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
        fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dsr})
        if i < skip:
            continue
        a = pha[0, 0]
        g = head_shoulders(a)
        if g:
            geo.append(g)
        # to'liq shaffof joyda rangni nolga tushiramiz: PNG ~10 barobar kichik bo'ladi
        rgb_f = fgr[0].transpose(1, 2, 0) * (a[..., None] > 0.004)
        rgba = np.concatenate([rgb_f, a[..., None]], axis=2)
        png.stdin.write((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
        written += 1
    png.stdin.close()
    png.wait()
    if not geo:
        raise SystemExit(f"[orqada] {at}-{out}: odam topilmadi")
    top, sh, cx, hw = (float(np.median([g[j] for g in geo])) for j in range(4))
    info = {"at": at, "out": out, "start": at, "frames": written, "headTop": round(top), "shoulderY": round(sh), "cx": round(cx), "headW": round(hw)}
    (out_dir / "info.json").write_text(json.dumps(info, indent=1), encoding="utf-8")
    return info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--loyiha", required=True)
    ap.add_argument("--models", default="models")
    ap.add_argument("--downsample", type=float, default=0.25, help="RVM ichki o'lcham (1080x1920 uchun 0.25)")
    a = ap.parse_args()
    proj = Path(a.loyiha).resolve()
    pub = proj / "public"
    plan = json.loads((pub / "plan.json").read_text(encoding="utf-8"))
    items = [k for k in plan.get("kinetic", []) if k.get("type") == "orqada"]
    result = []
    if items:
        mp = Path(a.models).resolve() / "rvm" / MODEL
        if not mp.exists():
            mp.parent.mkdir(parents=True, exist_ok=True)
            print(f"[orqada] model yuklanmoqda: {MODEL_URL}")
            urllib.request.urlretrieve(MODEL_URL, mp)
        talk_sha = file_sha(pub / "talk.mp4")
        sess, dev = None, None
        for k in items:
            key = hashlib.sha1(f"{talk_sha}|{k['at']}|{k['out']}|{WARM}|{a.downsample}|{MODEL}|{VERSION}".encode()).hexdigest()[:12]
            d = pub / "orqada" / key
            if (d / "info.json").exists():
                info = json.loads((d / "info.json").read_text(encoding="utf-8"))
                print(f"[orqada] {k['at']}-{k['out']} s: keshdan ({info['frames']} kadr)")
            else:
                if sess is None:
                    sess, dev = session(mp)
                    print(f"[orqada] qurilma: {dev}")
                t0 = time.time()
                info = process(sess, pub / "talk.mp4", k, d, a.downsample)
                print(f"[orqada] {k['at']}-{k['out']} s: {info['frames']} kadr, {time.time() - t0:.1f} s, bosh {info['headTop']}px, yelka {info['shoulderY']}px")
            info["dir"] = f"orqada/{key}"
            result.append(info)
    (pub / "orqada.json").write_text(json.dumps(result, indent=1), encoding="utf-8")
    print(f"[orqada] public/orqada.json: {len(result)} ta oraliq")


if __name__ == "__main__":
    main()
