import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SHADOW, SHADOW_SOFT, font, sec } from "./tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Critically damped: settles without overshoot, like iOS default springs
export const useIn = (at: number, dur = 0.9, bounce = false) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - sec(at),
    fps,
    config: bounce ? { damping: 15, mass: 0.8, stiffness: 120 } : { damping: 200 },
    durationInFrames: bounce ? undefined : sec(dur),
  });
};

export const useOut = (at: number | undefined, dur = 0.55) => {
  const frame = useCurrentFrame();
  if (at === undefined) return 0;
  return interpolate(frame, [sec(at), sec(at + dur)], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) });
};

export const useTween = (a: number, b: number, curve: [number, number, number, number] = [0.65, 0, 0.35, 1]) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [sec(a), sec(b)], [0, 1], { ...clamp, easing: Easing.bezier(...curve) });
};

const blurOf = (px: number) => (px > 0.15 ? `blur(${px.toFixed(2)}px)` : undefined);

// In from blur and depth, out by drifting toward the viewer
export const Reveal: React.FC<{
  at: number;
  out?: number;
  y?: number;
  x?: number;
  blur?: number;
  from?: number;
  dur?: number;
  bounce?: boolean;
  tilt?: number; // 3D: card swings in from this many degrees
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, out, y = 40, x = 0, blur = 22, from = 0.92, dur = 0.9, bounce = false, tilt = 0, style, children }) => {
  const p = useIn(at, tilt ? 1.2 : dur, bounce);
  const o = useOut(out);
  const pc = Math.min(1, p);
  const rot = tilt ? ` rotateX(${(1 - p) * tilt * 0.7}deg) rotateY(${(1 - p) * -tilt}deg)` : "";
  return (
    <div
      style={{
        opacity: Math.min(1, pc * 1.3) * (1 - o),
        filter: blurOf((1 - pc) * blur + o * 26),
        // exit flies through the camera: grows, lifts and blurs
        transform: `perspective(1400px) translate(${(1 - p) * x}px, ${(1 - p) * y - o * 60}px) scale(${lerp(from, 1, p) + o * 0.22})${rot}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Slow idle float so resting cards still breathe
export const Float: React.FC<{ seed?: number; amp?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ seed = 0, amp = 6, children, style }) => {
  const frame = useCurrentFrame();
  const y = Math.sin(frame / 38 + seed) * amp;
  const r = Math.sin(frame / 52 + seed * 1.7) * 0.6;
  return <div style={{ transform: `translateY(${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)`, ...style }}>{children}</div>;
};

// Pushes a block back in depth: smaller, softer, quieter
export const Recede: React.FC<{ at: number; amount?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  amount = 1,
  children,
  style,
}) => {
  const p = useIn(at, 1.0) * amount;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1 - 0.06 * p})`, filter: blurOf(p * 9), opacity: 1 - 0.45 * p, ...style }}>{children}</div>
  );
};

// Soft colour bloom behind an element
export const Glow: React.FC<{ at: number; out?: number; x: number; y: number; size?: number; color?: string }> = ({
  at,
  out,
  x,
  y,
  size = 520,
  color = C.greenGlow,
}) => {
  const p = useIn(at, 1.4);
  const o = useOut(out, 0.8);
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 22) * 0.04;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, rgba(32,196,126,0) 68%)`,
        filter: "blur(40px)",
        opacity: p * (1 - o) * 0.9,
        transform: `scale(${(0.6 + 0.4 * p) * breathe})`,
      }}
    />
  );
};

// Dynamic Island: a dark pill that grows sideways, then shows its content
export const Island: React.FC<{
  at: number;
  out?: number;
  width?: number;
  icon?: React.ReactNode;
  text: string;
  accent?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, out, width = 760, icon, text, accent, style }) => {
  const grow = useIn(at, 0.75);
  const content = useIn(at + 0.25, 0.6);
  const o = useOut(out, 0.5);
  const h = 104;
  const w = lerp(h, width, grow) * (1 - o * 0.25);
  return (
    <div style={{ display: "flex", justifyContent: "center", ...style }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          background: C.island,
          boxShadow: "0 20px 60px rgba(8,8,11,0.28)",
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "0 30px 0 22px",
          overflow: "hidden",
          opacity: Math.min(1, grow * 2) * (1 - o),
          transform: `scale(${lerp(0.6, 1, grow)})`,
          filter: blurOf(o * 14),
        }}
      >
        {icon ? (
          <div style={{ flex: "none", width: 62, height: 62, borderRadius: 31, background: "rgba(32,196,126,0.16)", display: "grid", placeItems: "center", opacity: content }}>
            {icon}
          </div>
        ) : null}
        <div style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", fontFamily: font, fontWeight: 600, fontSize: 32, color: C.white, letterSpacing: "-0.01em", opacity: content, filter: blurOf((1 - content) * 8) }}>
          {text}
        </div>
        {accent ? <div style={{ flex: "none", opacity: content }}>{accent}</div> : null}
      </div>
    </div>
  );
};

// Thick green stroke that draws in and wipes out along a path
export const Line: React.FC<{ at: number; dur?: number; d: string; width?: number; viewBox?: string; style?: React.CSSProperties }> = ({
  at,
  dur = 1.3,
  d,
  width = 28,
  viewBox = "0 0 1080 620",
  style,
}) => {
  const head = useTween(at, at + dur * 0.62, [0.5, 0, 0.2, 1]);
  const tail = useTween(at + dur * 0.38, at + dur, [0.6, 0, 0.3, 1]);
  if (head <= 0 || tail >= 1) return null;
  return (
    <svg viewBox={viewBox} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", ...style }}>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={C.green}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={`${Math.max(0.0001, head - tail)} 2`}
        strokeDashoffset={-tail}
        style={{ filter: "drop-shadow(0 10px 24px rgba(32,196,126,0.45))" }}
      />
    </svg>
  );
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; radius?: number }> = ({ children, style, radius = 40 }) => (
  <div style={{ background: C.white, borderRadius: radius, boxShadow: SHADOW, ...style }}>{children}</div>
);

export const AppIcon: React.FC<{ src: string; size?: number; pad?: number }> = ({ src, size = 72, pad = 0.14 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.2237, background: C.white, boxShadow: SHADOW_SOFT, display: "grid", placeItems: "center", overflow: "hidden", flex: "none" }}>
    <Img src={staticFile(src)} style={{ width: size * (1 - pad * 2), height: size * (1 - pad * 2), objectFit: "contain" }} />
  </div>
);

// iOS list where the focused row is sharp and the rest fall away in depth
export const DepthList: React.FC<{
  rows: { icon: React.ReactNode; label: string }[];
  focus: number;
  rowH?: number;
  width?: number;
  appear: number;
}> = ({ rows, focus, rowH = 118, width = 720, appear }) => (
  <div style={{ position: "relative", width, height: rowH * 3.6 }}>
    {rows.map((r, i) => {
      const d = i - focus;
      const ad = Math.abs(d);
      const vis = Math.max(0, Math.min(1, appear * rows.length - i * 0.6));
      return (
        <div
          key={r.label}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: rowH * 1.3 + d * rowH,
            height: rowH - 22,
            borderRadius: 30,
            background: C.white,
            boxShadow: SHADOW_SOFT,
            display: "flex",
            alignItems: "center",
            gap: 26,
            padding: "0 30px",
            opacity: vis * Math.max(0, 1 - ad * 0.38),
            filter: blurOf(ad * 5 + (1 - vis) * 16),
            transform: `scale(${1 - Math.min(ad, 3) * 0.07}) translateY(${(1 - vis) * 30}px)`,
          }}
        >
          {r.icon}
          <div style={{ fontFamily: font, fontWeight: 600, fontSize: 38, letterSpacing: "-0.015em", color: ad < 0.5 ? C.ink : C.grey }}>{r.label}</div>
        </div>
      );
    })}
  </div>
);

// macOS pointer; becomes a hand over buttons
export const Pointer: React.FC<{ hand?: boolean; press?: number }> = ({ hand = false, press = 0 }) => (
  <div style={{ transform: `scale(${1 - press * 0.14})`, transformOrigin: "20% 10%", filter: "drop-shadow(0 6px 10px rgba(8,8,11,0.25))" }}>
    {hand ? (
      <svg width="70" height="78" viewBox="0 0 28 31">
        <path d="M9 14V4.5a2 2 0 014 0V12l.2-1.6a2 2 0 014 .3V13l.3-1a2 2 0 013.8.8V15l.4-.6a1.9 1.9 0 013.3 1.7c-1 3.6-2 6.6-3.3 9-1.6 2.9-4 4.4-7.8 4.4-3.7 0-6.2-2.1-7.8-5.2L2.6 19a2 2 0 013.2-2.3L9 19.6" fill={C.white} stroke={C.ink} strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="58" height="70" viewBox="0 0 24 29">
        <path d="M3 2l17 13.4-7.6.9 4.4 8.3-3.4 1.7-4.3-8.4L3 22.6z" fill={C.ink} stroke={C.white} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

export const Glyph: React.FC<{ name: "server" | "lock" | "film" | "globe" | "crop" | "term" | "cube" | "check" | "cloud" | "laptop" | "msg" | "upload" | "phone" | "pin"; size?: number; color?: string }> = ({
  name,
  size = 34,
  color = C.green,
}) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    server: (<><rect x="4" y="4" width="16" height="7" rx="2.5" {...p} /><rect x="4" y="13" width="16" height="7" rx="2.5" {...p} /><path d="M8 7.5h.01M8 16.5h.01" {...p} strokeWidth={3} /></>),
    lock: (<><rect x="5" y="11" width="14" height="10" rx="3" {...p} /><path d="M8 11V8a4 4 0 018 0v3" {...p} /></>),
    film: (<><rect x="3.5" y="5" width="17" height="14" rx="3" {...p} /><path d="M10 9.5v5l4.5-2.5z" fill={color} stroke="none" /></>),
    globe: (<><circle cx="12" cy="12" r="8.5" {...p} /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5z" {...p} /></>),
    crop: (<><path d="M7 3v13a1 1 0 001 1h13M3 7h13a1 1 0 011 1v13" {...p} /></>),
    term: (<><rect x="3" y="4.5" width="18" height="15" rx="3" {...p} /><path d="M7.5 10l2.5 2-2.5 2M12.5 15h4" {...p} /></>),
    cube: (<><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5M12 12v9" {...p} /></>),
    check: (<path d="M5 12.5l4.5 4.5L19 7.5" {...p} strokeWidth={2.6} />),
    cloud: (<path d="M7 18.5h10.5a4 4 0 00.6-7.95A6 6 0 006.4 9.6 4.5 4.5 0 007 18.5z" {...p} />),
    laptop: (<><rect x="5" y="5" width="14" height="10" rx="2" {...p} /><path d="M3 18.5h18" {...p} /></>),
    msg: (<path d="M12 4.5c4.7 0 8.5 3 8.5 6.8s-3.8 6.8-8.5 6.8c-1 0-2-.1-2.9-.4L5 19.5l1.2-3.4c-1.7-1.3-2.7-3-2.7-4.8 0-3.8 3.8-6.8 8.5-6.8z" fill={color} stroke="none" />),
    upload: (<><path d="M12 16V5M7.5 9.5L12 5l4.5 4.5" {...p} /><path d="M5 19h14" {...p} /></>),
    phone: (<><rect x="7" y="2.5" width="10" height="19" rx="3" {...p} /><path d="M11 18.5h2" {...p} /></>),
    pin: (<><path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 00-13 0c0 4.8 6.5 11 6.5 11z" {...p} /><circle cx="12" cy="10" r="2.3" {...p} /></>),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
};

// App icon living inside a line of text; pops in with a small iOS bounce
export const InlineIcon: React.FC<{ at: number; size: number; children: React.ReactNode }> = ({ at, size, children }) => {
  const p = useIn(at, 0, true);
  const vis = Math.min(1, useIn(at, 0.4) * 1.3);
  const s = size * 1.18;
  return (
    <span style={{ display: "inline-block", width: s * Math.min(1, vis * 1.4), height: s, margin: `0 ${size * 0.2 * vis}px`, verticalAlign: "middle", position: "relative", top: -size * 0.06 }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: s,
          height: s,
          borderRadius: s * 0.2237,
          overflow: "hidden",
          boxShadow: "0 10px 26px rgba(8,8,11,0.18)",
          opacity: vis,
          transform: `scale(${0.3 + 0.7 * p}) rotate(${(1 - p) * -14}deg)`,
          display: "grid",
          placeItems: "center",
          background: C.white,
        }}
      >
        {children}
      </span>
    </span>
  );
};

// Two-tone headline: first part ink, second part grey, optional inline icon between them
export const TwoTone: React.FC<{ a: string; b?: string; size?: number; light?: boolean; icon?: React.ReactNode; style?: React.CSSProperties }> = ({
  a,
  b,
  size = 76,
  light = false,
  icon,
  style,
}) => (
  <div style={{ fontFamily: font, fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.035em", textAlign: "center", color: light ? C.white : C.ink, ...style }}>
    {a}
    {icon ?? (b ? " " : null)}
    {b ? <span style={{ color: light ? "rgba(255,255,255,0.55)" : C.grey }}>{b}</span> : null}
  </div>
);
