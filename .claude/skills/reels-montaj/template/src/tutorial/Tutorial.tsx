// FORMAT: tutorial — ekran yozuvi tepada, spiker pastda; hook va CTA da spiker to'liq kadrda
import React from "react";
import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { Captions, EndFade, Shade, SfxLayer } from "../common";
import { Glyph, Island, useTween } from "../kit";
import { C, CAPTION_TOP, ISLAND_TOP, SPLIT_Y, TALK_SHIFT } from "../tokens";
import type { ReelProps, TutorialPlan } from "../types";
import { Cta, TutScenes } from "./scenes";

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
const EMPTY: TutorialPlan = { format: "tutorial" };

// split = 1: ekran tepada; 0: spiker to'liq kadrda
const useSplit = (plan: TutorialPlan) => {
  const full = plan.full ?? [];
  let s = plan.scenes?.length ? 1 : 0;
  for (const [a, b] of full) {
    // hook soni har renderda o'zgarmaydi (plan doimiy), shuning uchun tsikl ichida hook xavfsiz
    s -= useTween(a - 0.25, a + 0.35, EASE) - useTween(b - 0.3, b + 0.3, EASE);
  }
  return Math.max(0, Math.min(1, s));
};

export const Tutorial: React.FC<ReelProps> = ({ meta, captions, plan }) => {
  const p = plan && plan.format === "tutorial" ? plan : EMPTY;
  const split = useSplit(p);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <AbsoluteFill style={{ transform: `translateY(${split * TALK_SHIFT}px)` }}>
        <Video src={staticFile(meta.talk)} objectFit="cover" style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <Shade />
      {p.scenes?.length ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: SPLIT_Y, background: C.canvas, transform: `translateY(${-(1 - split) * (SPLIT_Y + 40)}px)`, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
          <TutScenes scenes={p.scenes} meta={meta} />
        </div>
      ) : null}
      {p.island ? (
        <Island at={p.island.at} out={p.island.out} width={820} icon={<Glyph name="film" size={34} color={C.green} />} text={p.island.text} style={{ position: "absolute", left: 0, right: 0, top: ISLAND_TOP }} />
      ) : null}
      {p.cta ? <Cta {...p.cta} /> : null}
      {p.captions !== false ? <Captions chunks={captions} top={CAPTION_TOP} theme="tutorial" /> : null}
      <EndFade />
      <SfxLayer list={p.sfx} />
    </AbsoluteFill>
  );
};
