"""NavaiSTT (faster-whisper) bilan so'zma-so'z transkripsiya.

    .venv\\Scripts\\python words.py <audio.wav> <words.json> [--models D:/Ai-kurs/models] [--til uz] [--qurilma auto|cuda|cpu]

Natija: [[start, end, "so'z"], ...]. Model birinchi marta --models papkasiga yuklanadi (~1.5 GB), keyin oflayn ishlaydi.
Manba: montaj-skills (muallif Umid), Windows uchun qayta yozildi.
"""
import argparse
import json
import sys
from pathlib import Path

MODEL_UZ = "abduaziz/navaistt_v2_medium_ct2"  # o'zbekcha
MODEL_BOSHQA = "medium"  # rus/ingliz uchun oddiy whisper


def load(model_name: str, models: str, qurilma: str):
    from faster_whisper import WhisperModel

    variants = [("cuda", "float16"), ("cpu", "int8")] if qurilma == "auto" else [(qurilma, "float16" if qurilma == "cuda" else "int8")]
    last = None
    for dev, ct in variants:
        try:
            m = WhisperModel(model_name, device=dev, compute_type=ct, download_root=models)
            return m, dev
        except Exception as e:  # CUDA kutubxonalari (cuBLAS/cuDNN) bo'lmasa CPU ga o'tamiz
            last = e
            print(f"[words] {dev} ishlamadi: {str(e)[:120]}", file=sys.stderr)
    raise SystemExit(f"Model yuklanmadi: {last}")


def read_wav(path: str):
    """16 kHz mono wav ni o'zimiz o'qiymiz: PyAV versiyasiga bog'liq xatolardan qochish uchun
    (av 16+ da faster-whisper 'metadata_errors' xatosi beradi). Boshqa format bo'lsa yo'lni o'zini qaytaradi."""
    import wave

    import numpy as np

    if not path.lower().endswith(".wav"):
        return path
    with wave.open(path, "rb") as w:
        if w.getframerate() != 16000 or w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise SystemExit("wav 16 kHz, mono, 16-bit bo'lishi kerak (tayyorla.py shunday yozadi)")
        data = w.readframes(w.getnframes())
    return np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0


def transcribe(m, audio: str, til: str):
    segs, _ = m.transcribe(read_wav(audio), language=til, condition_on_previous_text=False, word_timestamps=True, beam_size=5, vad_filter=False)
    out = []
    for s in segs:
        for w in s.words or []:
            out.append([round(w.start, 2), round(w.end, 2), w.word.strip()])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--models", default=str(Path.cwd() / "models"))
    ap.add_argument("--til", default="uz")
    ap.add_argument("--qurilma", default="auto", choices=["auto", "cuda", "cpu"])
    a = ap.parse_args()
    Path(a.models).mkdir(parents=True, exist_ok=True)
    name = MODEL_UZ if a.til == "uz" else MODEL_BOSHQA
    m, dev = load(name, a.models, a.qurilma)
    try:
        out = transcribe(m, a.audio, a.til)
    except Exception as e:
        if dev == "cpu":
            raise
        # CUDA model yuklanib, lekin ishlashda yiqilsa (cuDNN yo'q) — CPU da qaytadan
        print(f"[words] cuda transkripsiyada yiqildi ({str(e)[:100]}), CPU ga o'tildi", file=sys.stderr)
        m, dev = load(name, a.models, "cpu")
        out = transcribe(m, a.audio, a.til)
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"[words] {len(out)} so'z, qurilma: {dev}")
    print(" ".join(f"{s}:{w}" for s, _, w in out))


if __name__ == "__main__":
    main()
