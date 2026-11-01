// ekspert-motion qismlari: references/motion-uslub.md asosida
// kinetik matn (katta, plashka, hisob, royxat, eski-yangi, arvoh), B-roll, grafik sahna, obuna kartochkasi
//
// IERARXIYA: har gapda bitta "katta" so'z (ekran kengligining ~82%, qalin condensed, oq yoki laym).
// "plashka" faqat ikkinchi darajali kalit so'zlar uchun. Yordamchi so'zlar (sub) kamida SUB_MIN px.
import React, { useEffect, useState } from "react";
import { Video } from "@remotion/media";
import { fitText } from "@remotion/layout-utils";
import { AbsoluteFill, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Between } from "../common";
import { Reveal, lerp, useIn, useOut, useTween } from "../kit";
import { BIG_WIDTH, C, COUNTER_HOLD, SHADOW, SUB_MIN, SUB_SIZE, W, font, fontCond, fontCondLoader, sec } from "../tokens";
import type { BRoll, Kinetic } from "../types";

const BIG = { fontFamily: fontCond, fontWeight: 700, textTransform: "uppercase" as const, lineHeight: 0.95, letterSpacing: "0.005em" };
const SMALL = { fontFamily: font, fontWeight: 500, letterSpacing: "-0.01em" };
const shadow = "0 6px 30px rgba(0,0,0,0.45)";
// Yordamchi so'z uslubi: condensed, katta harf, ingichka (400) — katta so'zdan (700) og'irligi bilan ajralib turadi.
// Kichik harfli Inter 46px ekranda ~24px ko'rinardi; endi harf balandligi >= SUB_MIN.
const SUBSTYLE: React.CSSProperties = { fontFamily: fontCond, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: Math.max(SUB_SIZE, Math.ceil(SUB_MIN / 0.81)), lineHeight: 1 };

// Matnni berilgan kenglikka sig'diradigan shrift o'lchami. Shrift yuklanmaguncha render kutadi (delayRender),
// aks holda fitText zaxira shrift bilan noto'g'ri o'lchaydi.
const useFitSize = (text: string, widthFrac = BIG_WIDTH, max = 520) => {
  const [size, setSize] = useState<number | null>(null);
  const [handle] = useState(() => delayRender(`fitText: ${text}`));
  useEffect(() => {
    let alive = true;
    fontCondLoader
      .waitUntilDone()
      .then(() => {
        const { fontSize } = fitText({ text: text.toUpperCase(), withinWidth: W * widthFrac, fontFamily: fontCond, fontWeight: "700" });
        if (alive) setSize(Math.min(max, Math.floor(fontSize)));
      })
      .finally(() => continueRender(handle));
    return () => {
      alive = false;
    };
  }, [text, widthFrac, max, handle]);
  return size;
};

// Laym plashka: IKKINCHI darajali kalit so'z, qora matn
const Plashka: React.FC<{ at: number; text: string; size?: number }> = ({ at, text, size = 104 }) => {
  const p = useIn(at, 0.45);
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "4px 22px 0" }}>
      <span style={{ position: "absolute", inset: 0, background: C.accent, borderRadius: 14, transform: `scaleX(${p})`, transformOrigin: "0% 50%", boxShadow: `0 10px 40px ${C.accentGlow}` }} />
      <span style={{ position: "relative", ...BIG, fontSize: size, color: C.ink, opacity: Math.min(1, p * 1.6) }}>{text}</span>
    </span>
  );
};

// Katta so'z: ekran kengligining ~82% i
const BigWord: React.FC<{ text: string; color?: string }> = ({ text, color = C.white }) => {
  const size = useFitSize(text);
  if (!size) return null;
  return <div style={{ ...BIG, fontSize: size, lineHeight: 0.9, color, textShadow: shadow, whiteSpace: "nowrap" }}>{text}</div>;
};

// Hisoblagich vaqtlari: sanash (0,4–1,2 s), keyin oxirgi qiymatda kamida COUNTER_HOLD s turadi, keyin 0,3 s da yo'qoladi
const FADE = 0.3;
export const counterTimes = (k: Kinetic) => {
  const countEnd = Math.max(k.at + 0.4, Math.min(k.at + 1.2, k.out - FADE - COUNTER_HOLD));
  const out = Math.max(k.out, countEnd + COUNTER_HOLD + FADE); // reja juda qisqa bo'lsa, o'zi uzaytiriladi
  return { countEnd, out };
};
const fmt = (v: number, prefix = "", suffix = "") => `${prefix}${v.toLocaleString("en-US")}${suffix}`;

const Counter: React.FC<{ k: Kinetic }> = ({ k }) => {
  const from = k.from ?? 0;
  const to = k.to ?? 100;
  const { countEnd } = counterTimes(k);
  const t = useTween(k.at, countEnd, [0.2, 0, 0.1, 1]);
  const size = useFitSize(fmt(to, k.prefix, k.suffix)); // eni oxirgi qiymat bo'yicha, raqamlar teng enli
  if (!size) return null;
  return (
    <span style={{ ...BIG, fontSize: size, lineHeight: 0.9, color: k.rang === "oq" ? C.white : C.accent, textShadow: shadow, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
      {fmt(Math.round(lerp(from, to, t)), k.prefix, k.suffix)}
    </span>
  );
};

// Bitta kinetik matn hodisasi
const KineticItem: React.FC<{ k: Kinetic; out: number }> = ({ k, out }) => {
  const y = k.y ?? 560;
  const o = useOut(out - FADE, FADE);
  const swap = useIn(k.at + 0.7, 0.4); // faqat eski-yangi uchun; hook shartsiz chaqiriladi
  const box: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", opacity: 1 - o, filter: o > 0.05 ? `blur(${o * 18}px)` : undefined };
  const sub = k.sub ? (
    <Reveal at={k.at + 0.15} y={16} blur={10} style={{ ...SUBSTYLE, color: C.white, textShadow: shadow, marginBottom: 14 }}>
      {k.sub}
    </Reveal>
  ) : null;

  if (k.type === "plashka")
    return (
      <div style={box}>
        {sub}
        <Reveal at={k.at} y={30} blur={20}>
          <Plashka at={k.at} text={k.main ?? ""} />
        </Reveal>
      </div>
    );
  if (k.type === "katta")
    return (
      <div style={box}>
        {sub}
        <Reveal at={k.at} y={40} blur={24} from={0.85}>
          <BigWord text={k.main ?? ""} color={k.rang === "laym" ? C.accent : C.white} />
        </Reveal>
      </div>
    );
  if (k.type === "hisob")
    return (
      <div style={box}>
        {sub}
        <Reveal at={k.at} y={30} blur={20}>
          <Counter k={k} />
        </Reveal>
      </div>
    );
  if (k.type === "royxat")
    return (
      <div style={{ ...box, gap: 22 }}>
        {sub}
        {(k.items ?? []).map((it, i) => (
          <Reveal key={i} at={k.at + 0.2 + i * 0.35} y={-60} blur={14} bounce>
            <div style={{ ...BIG, fontSize: 64, color: C.ink, background: C.accent, padding: "14px 34px 8px", borderRadius: 18, boxShadow: `0 10px 30px ${C.accentGlow}` }}>{it}</div>
          </Reveal>
        ))}
      </div>
    );
  if (k.type === "eski-yangi") {
    return (
      <div style={box}>
        {sub}
        <div style={{ ...BIG, fontSize: 110, color: "rgba(255,255,255,0.45)", textDecoration: swap > 0.3 ? "line-through" : undefined, textDecorationColor: C.accent, textDecorationThickness: 10 }}>
          <Reveal at={k.at} y={20} blur={14}>
            {k.old}
          </Reveal>
        </div>
        <div style={{ marginTop: 20, opacity: swap }}>
          <Plashka at={k.at + 0.7} text={k.main ?? ""} />
        </div>
      </div>
    );
  }
  // arvoh: katta xira so'z (haqiqiy "odam orqasida" effekti hali yo'q — SKILL.md ga qara)
  return (
    <div style={{ ...box, top: y - 120 }}>
      <Reveal at={k.at} y={0} blur={30} from={1.15} style={{ ...BIG, fontSize: 300, color: "rgba(255,255,255,0.16)" }}>
        {k.main}
      </Reveal>
    </div>
  );
};

export const KineticLayer: React.FC<{ list?: Kinetic[] }> = ({ list = [] }) => (
  <>
    {list.map((k, i) => {
      const out = k.type === "hisob" ? counterTimes(k).out : k.out;
      return (
        <Between key={i} a={k.at} b={out}>
          <KineticItem k={k} out={out} />
        </Between>
      );
    })}
  </>
);

// Grafik sahna foni: qora gradient + ingichka grid + laym nur (Qo'shimcha reference'lardan)
export const GridBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 30%, #1b1f14 0%, #0b0c09 60%, #050505 100%)" }}>
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(f * 0.6) % 90}px`,
        }}
      />
      <div style={{ position: "absolute", left: W / 2 - 450, top: 420, width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, ${C.accentGlow} 0%, rgba(150,223,1,0) 65%)`, filter: "blur(60px)", opacity: 0.55 }} />
    </AbsoluteFill>
  );
};

// To'liq ekranli B-roll: video/rasm sekin yaqinlashadi (dolly/zoom). grafik — faqat ZAXIRA (KATALOG da mos klip bo'lmasa)
const BRollItem: React.FC<{ b: BRoll }> = ({ b }) => {
  const z = lerp(1.0, 1.12, useTween(b.a, b.b, [0.33, 0, 0.67, 1]));
  const inn = useIn(b.a, 0.25);
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` };
  return (
    <AbsoluteFill style={{ opacity: inn, background: C.ink }}>
      {b.kind === "video" && b.src ? (
        <Sequence from={sec(b.a)} layout="none">
          <Video src={staticFile(b.src)} objectFit="cover" muted trimBefore={sec(b.from ?? 0)} style={style} />
        </Sequence>
      ) : b.kind === "image" && b.src ? (
        <Img src={staticFile(b.src)} style={style} />
      ) : (
        <GridBg />
      )}
      {b.kind === "grafik" && b.main ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {b.sub ? (
            <Reveal at={b.a + 0.1} y={16} blur={10} style={{ ...SUBSTYLE, color: C.white, marginBottom: 18 }}>
              {b.sub}
            </Reveal>
          ) : null}
          <Reveal at={b.a + 0.2} y={30} blur={20}>
            <BigWord text={b.main} color={C.accent} />
          </Reveal>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const BRollLayer: React.FC<{ list?: BRoll[] }> = ({ list = [] }) => (
  <>
    {list.map((b, i) => (
      <Between key={i} a={b.a} b={b.b}>
        <BRollItem b={b} />
      </Between>
    ))}
  </>
);

// Punch-in: urg'uli gapda kadr keskin kattalashadi
export const usePunch = (list: { a: number; b: number; scale?: number }[] = []) => {
  const f = useCurrentFrame();
  let s = 1;
  for (const p of list) {
    if (f >= sec(p.a) && f < sec(p.b)) {
      const k = p.scale ?? 1.18;
      // 3 kadrda kattalashadi, keyin juda sekin davom etadi
      s = interpolate(f, [sec(p.a), sec(p.a) + 3, sec(p.b)], [1, k, k + 0.02], { extrapolateRight: "clamp" });
    }
  }
  return s;
};

// Obuna kartochkasi: avatar, @username, "Obuna" tugmasi bosiladi -> "Rahmat"
export const SubscribeCard: React.FC<{ at: number; username: string; name?: string; avatar?: string }> = ({ at, username, name, avatar }) => {
  const press = useIn(at + 1.3, 0.25);
  const done = press > 0.5;
  return (
    <Reveal at={at} y={80} blur={18} bounce style={{ position: "absolute", left: 110, right: 110, top: 1180 }}>
      <div style={{ background: "rgba(20,20,20,0.82)", backdropFilter: "blur(24px)", borderRadius: 40, padding: "26px 30px", display: "flex", alignItems: "center", gap: 24, boxShadow: SHADOW, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", background: C.accent, flex: "none", display: "grid", placeItems: "center", ...BIG, fontSize: 52, color: C.ink }}>
          {avatar ? <Img src={staticFile(avatar)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (name ?? username).replace("@", "").slice(0, 1)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {name ? <div style={{ ...SMALL, fontWeight: 700, fontSize: 44, color: C.white }}>{name}</div> : null}
          <div style={{ ...SMALL, fontSize: SUB_MIN, color: "rgba(255,255,255,0.65)" }}>{username.startsWith("@") ? username : `@${username}`}</div>
        </div>
        <div style={{ ...SMALL, fontWeight: 700, fontSize: SUB_MIN, padding: "16px 30px", borderRadius: 999, background: done ? "rgba(255,255,255,0.12)" : C.accent, color: done ? C.white : C.ink, transform: `scale(${1 - Math.sin(Math.min(1, press) * Math.PI) * 0.1})` }}>
          {done ? "Rahmat ✓" : "Obuna"}
        </div>
      </div>
    </Reveal>
  );
};
