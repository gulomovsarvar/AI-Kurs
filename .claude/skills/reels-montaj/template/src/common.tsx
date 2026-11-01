// Ikkala format uchun umumiy qismlar: ma'lumot yuklash, subtitr, SFX, yakuniy qorayish
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FPS, font, fontCond, sec } from "./tokens";
import type { Meta, Plan, ReelProps, Sfx, Word } from "./types";

const getJson = async <T,>(name: string, fallback: T): Promise<T> => {
  try {
    const r = await fetch(staticFile(name));
    if (!r.ok) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
};

// Davomiylik har safar kirish videosidan (meta.json) hisoblanadi
export const loadReel: CalculateMetadataFunction<ReelProps> = async () => {
  const meta = await getJson<Meta | null>("meta.json", null);
  if (!meta) throw new Error("public/meta.json topilmadi. Avval: python scripts/tayyorla.py --kirish <video> --loyiha <montaj papka>");
  const captions = await getJson<Word[][]>("captions.json", []);
  const plan = await getJson<Plan | null>("plan.json", null);
  return { durationInFrames: Math.max(1, Math.round(meta.duration * FPS)), props: { meta, captions, plan } };
};

// So'zma-so'z subtitr: aytilgan so'z yorqin, keyingisi xira.
// tutorial: Inter, raqamlar yashil. motion: Oswald katta harf, joriy so'z laym plashkada.
export const Captions: React.FC<{ chunks: Word[][]; top: number; theme: "tutorial" | "motion" }> = ({ chunks, top, theme }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const idx = chunks.findIndex((c, i) => {
    const next = chunks[i + 1];
    const end = next ? Math.min(next[0].s - 0.08, c[c.length - 1].e + 0.8) : c[c.length - 1].e + 0.6;
    return t >= c[0].s - 0.08 && t < end;
  });
  if (idx < 0) return null;
  const chunk = chunks[idx];
  const p = spring({ frame: frame - sec(chunk[0].s - 0.08), fps: FPS, config: { damping: 200 }, durationInFrames: 10 });
  const motion = theme === "motion";
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: motion ? fontCond : font,
          fontWeight: motion ? 700 : 600,
          fontSize: motion ? 68 : 56,
          lineHeight: 1.18,
          letterSpacing: motion ? "0.01em" : "-0.02em",
          textTransform: motion ? "uppercase" : undefined,
          textAlign: "center",
          opacity: p,
          filter: p < 0.98 ? `blur(${(1 - p) * 10}px)` : undefined,
          transform: `translateY(${(1 - p) * 14}px)`,
          textShadow: "0 2px 18px rgba(0,0,0,0.45)",
        }}
      >
        {chunk.map((w, i) => {
          const said = t >= w.s - 0.04;
          const now = said && t < w.e + 0.05;
          const hot = /\d/.test(w.t);
          const space = i < chunk.length - 1 ? " " : "";
          if (motion && now) {
            return (
              <span key={i}>
                <span style={{ background: C.accent, color: C.ink, padding: "0 10px", borderRadius: 8, textShadow: "none" }}>{w.t}</span>
                {space}
              </span>
            );
          }
          return (
            <span key={i} style={{ color: said ? (hot ? (motion ? C.accent : C.green) : C.white) : "rgba(255,255,255,0.45)" }}>
              {w.t}
              {space}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const SfxLayer: React.FC<{ list?: Sfx[] }> = ({ list = [] }) => (
  <>
    {list.map((s, i) => (
      <Sequence key={i} from={sec(s.at)} durationInFrames={sec(3)} layout="none">
        <Audio src={staticFile(`sfx/${s.file}`)} volume={s.vol ?? 0.2} />
      </Sequence>
    ))}
  </>
);

// Oxirgi 0,4 s da qora rangga o'tish
export const EndFade: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [durationInFrames - sec(0.4), durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: C.ink, opacity: o }} />;
};

// Pastki soyacha: subtitr har qanday kadrda o'qilsin
export const Shade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.5) 100%)" }} />
);

// Faqat [a, b) oraliqda chizadi
export const Between: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => {
  const f = useCurrentFrame();
  if (f < sec(a) - 2 || f >= sec(b)) return null;
  return <>{children}</>;
};
