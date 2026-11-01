// tutorial formatining sahnalari. Hammasi plan.json dan keladigan ma'lumot bilan ishlaydi.
import React from "react";
import { Video } from "@remotion/media";
import { Sequence, staticFile, useCurrentFrame } from "remotion";
import { Between } from "../common";
import { Reveal, lerp, useIn, useTween } from "../kit";
import { C, SHADOW, SHADOW_SOFT, SPLIT_Y, W, font, sec } from "../tokens";
import type { Meta, TutScene, TutShot } from "../types";

// Yuqori panel ichidagi oyna kartochkasi
const CARD = { x: 40, y: 150, w: W - 80, h: SPLIT_Y - 150 - 40 };

const Header: React.FC<{ at: number; n?: number; text: string }> = ({ at, n, text }) => (
  <Reveal at={at} y={18} blur={12} style={{ position: "absolute", left: CARD.x + 6, top: 56, display: "flex", alignItems: "center", gap: 18 }}>
    {n ? (
      <div style={{ width: 64, height: 64, borderRadius: 32, background: C.ink, color: C.white, display: "grid", placeItems: "center", fontFamily: font, fontWeight: 700, fontSize: 32 }}>{n}</div>
    ) : null}
    <div style={{ fontFamily: font, fontWeight: 700, fontSize: 44, letterSpacing: "-0.025em", color: C.ink }}>{text}</div>
  </Reveal>
);

const Window: React.FC<{ at: number; dark?: boolean; children: React.ReactNode }> = ({ at, dark = true, children }) => (
  <Reveal at={at} y={40} blur={16} from={0.96} style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: dark ? "#141416" : C.white, boxShadow: SHADOW, position: "relative" }}>{children}</div>
  </Reveal>
);

// Ekran yozuvidan kesilgan bo'lak (x, y, w — manba pikselida), sekin yaqinlashadi
const Tut: React.FC<TutShot & { meta: Meta }> = ({ a, b, from, rate = 1, x, y, w, meta }) => {
  const k = CARD.w / w;
  const z = lerp(1, 1.05, useTween(a, b, [0.33, 0, 0.67, 1]));
  if (!meta.tut) return null;
  return (
    <Sequence from={sec(a)} durationInFrames={Math.max(1, sec(b - a))} layout="none">
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: "50% 50%" }}>
        <Video
          src={staticFile(meta.tut.file)}
          muted
          trimBefore={sec(from)}
          playbackRate={rate}
          style={{ position: "absolute", left: -x * k, top: -y * k, width: meta.tut.w * k, height: meta.tut.h * k, maxWidth: "none" }}
        />
      </div>
    </Sequence>
  );
};

const Step: React.FC<{ s: Extract<TutScene, { type: "step" }>; meta: Meta }> = ({ s, meta }) => (
  <>
    <Header at={s.a} n={s.n} text={s.title} />
    <Window at={s.a}>
      {s.shots.map((shot, i) => (
        <Tut key={i} {...shot} meta={meta} />
      ))}
    </Window>
  </>
);

// Ro'yxat (asboblar, havolalar). 7 qatordan ko'p bo'lsa sig'maydi
const List: React.FC<{ s: Extract<TutScene, { type: "list" }> }> = ({ s }) => (
  <>
    <Header at={s.a} n={s.n} text={s.title} />
    <Window at={s.a} dark={false}>
      <div style={{ padding: "18px 34px", display: "flex", flexDirection: "column" }}>
        {s.rows.map(([name, what, link], i) => (
          <Reveal key={name + i} at={s.a + 0.35 + i * 0.32} y={22} blur={10} from={0.98}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 0", borderBottom: i < s.rows.length - 1 ? `1px solid ${C.fill}` : "none", fontFamily: font }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: C.green, flex: "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", color: C.ink }}>
                  {name} <span style={{ fontWeight: 500, fontSize: 28, color: C.grey }}>· {what}</span>
                </div>
                {link ? <div style={{ fontWeight: 500, fontSize: 22, color: "#2F6FDE" }}>{link}</div> : null}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Window>
  </>
);

// Matn harfma-harf yoziladi (prompt, buyruq)
const Typed: React.FC<{ s: Extract<TutScene, { type: "typed" }> }> = ({ s }) => {
  const f = useCurrentFrame();
  const end = s.typeEnd ?? s.a + (s.b - s.a) * 0.6;
  const total = s.lines.join("\n").length;
  const shown = Math.floor(total * Math.min(1, Math.max(0, (f - sec(s.a + 0.4)) / Math.max(1, sec(end - s.a - 0.4)))));
  let left = shown;
  return (
    <>
      <Header at={s.a} n={s.n} text={s.title} />
      <Window at={s.a} dark={false}>
        <div style={{ padding: "34px 40px", fontFamily: font, fontSize: 30, lineHeight: 1.42, color: C.ink, fontWeight: 500 }}>
          {s.lines.map((line, i) => {
            const part = line.slice(0, Math.max(0, left));
            left -= line.length + 1;
            return (
              <div key={i} style={{ minHeight: 18, fontWeight: i === 0 ? 700 : 500 }}>
                {part}
                {left < 0 && left > -line.length - 2 && f % 30 < 18 ? <span style={{ color: C.green }}>|</span> : null}
              </div>
            );
          })}
        </div>
      </Window>
    </>
  );
};

const Bubble: React.FC<{ at: number; me?: boolean; children: React.ReactNode }> = ({ at, me = false, children }) => (
  <Reveal at={at} y={26} blur={12} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start" }}>
    <div style={{ maxWidth: 720, padding: "22px 30px", borderRadius: 34, background: me ? C.ink : C.fill, color: me ? C.white : C.ink, fontFamily: font, fontWeight: 600, fontSize: 38, letterSpacing: "-0.01em", boxShadow: SHADOW_SOFT }}>
      {children}
    </div>
  </Reveal>
);

// Chat pufakchalari (feedback, savol-javob)
const Chat: React.FC<{ s: Extract<TutScene, { type: "chat" }> }> = ({ s }) => (
  <>
    <Header at={s.a} n={s.n} text={s.title} />
    <Window at={s.a} dark={false}>
      <div style={{ padding: "56px 44px", display: "flex", flexDirection: "column", gap: 30 }}>
        {s.bubbles.map((b, i) => (
          <Bubble key={i} at={b.at} me={b.me}>
            {b.text}
          </Bubble>
        ))}
        {s.chips?.length ? (
          <Reveal at={s.bubbles[s.bubbles.length - 1]?.at + 1.2 || s.a + 1} y={20} blur={10} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
            {s.chips.map((c) => (
              <div key={c} style={{ padding: "14px 26px", borderRadius: 999, border: `2px solid ${C.ink}`, fontFamily: font, fontWeight: 600, fontSize: 32, color: C.ink }}>
                {c}
              </div>
            ))}
          </Reveal>
        ) : null}
      </div>
    </Window>
  </>
);

export const TutScenes: React.FC<{ scenes: TutScene[]; meta: Meta }> = ({ scenes, meta }) => (
  <>
    {scenes.map((s, i) => (
      <Between key={i} a={s.a} b={s.b}>
        {s.type === "step" ? <Step s={s} meta={meta} /> : s.type === "list" ? <List s={s} /> : s.type === "typed" ? <Typed s={s} /> : <Chat s={s} />}
      </Between>
    ))}
  </>
);

// To'liq kadrdagi CTA: izoh maydoniga so'z yoziladi va yuboriladi
export const Cta: React.FC<{ a: number; b: number; typeAt: number; word: string; label: string }> = ({ a, b, typeAt, word, label }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(word.length, Math.floor((f - sec(typeAt)) / 4)));
  const sent = useIn(typeAt + word.length * 0.13 + 0.4, 0.5);
  return (
    <Between a={a} b={b}>
      <Reveal at={a + 0.2} y={60} tilt={8} style={{ position: "absolute", left: 90, width: W - 180, top: 1180 }}>
        <div style={{ background: "rgba(255,255,255,0.86)", backdropFilter: "blur(30px) saturate(180%)", borderRadius: 44, boxShadow: SHADOW, padding: "30px 34px", fontFamily: font }}>
          <div style={{ fontWeight: 600, fontSize: 30, color: C.grey }}>{label}</div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ flex: 1, height: 84, borderRadius: 42, background: C.fill, display: "flex", alignItems: "center", padding: "0 30px", fontWeight: 700, fontSize: 38, color: C.ink, letterSpacing: "0.04em" }}>
              {n ? word.slice(0, n) : <span style={{ color: C.greyLight, fontWeight: 500, letterSpacing: 0 }}>Izoh yozing…</span>}
            </div>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: sent > 0.5 ? C.green : C.ink, display: "grid", placeItems: "center", transform: `scale(${1 + Math.sin(Math.min(1, sent) * Math.PI) * 0.12})` }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </Reveal>
    </Between>
  );
};
