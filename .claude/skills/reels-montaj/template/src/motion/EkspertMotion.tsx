// FORMAT: ekspert-motion — to'liq ekranli spiker + kinetik matn + B-roll + punch-in + obuna kartochkasi
// Qoidalar manbasi: references/motion-uslub.md
import React from "react";
import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { Between, Captions, EndFade, Shade, SfxLayer } from "../common";
import { C, MOTION_CAPTION_TOP, PUNCH_ORIGIN_Y } from "../tokens";
import type { MotionPlan, ReelProps } from "../types";
import { BRollLayer, KineticLayer, OrqadaWordLayer, PersonLayer, SubscribeCard, usePunch } from "./parts";

const EMPTY: MotionPlan = { format: "ekspert-motion" };

// Asl video va "faqat odam" qatlami bir xil ko'rinishda bo'lishi uchun umumiy filtr va transformatsiya
const LOOK = "contrast(1.06) saturate(1.04) brightness(0.96)";

export const EkspertMotion: React.FC<ReelProps> = ({ meta, captions, plan, orqada = [] }) => {
  const p = plan && plan.format === "ekspert-motion" ? plan : EMPTY;
  const zoom = usePunch(p.punch);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {/* A-roll: spiker to'liq kadrda, biroz qorong'i-kontrast (motion-uslub: "qorong'i, iliq, kontrastli") */}
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${PUNCH_ORIGIN_Y * 100}%` }}>
        <Video src={staticFile(meta.talk)} objectFit="cover" style={{ width: "100%", height: "100%", filter: LOOK }} />
      </AbsoluteFill>
      {/* "orqada": so'z asl video ustida, lekin odam qatlami ostida */}
      <OrqadaWordLayer list={p.kinetic} infos={orqada} zoom={zoom} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${PUNCH_ORIGIN_Y * 100}%`, filter: LOOK }}>
        <PersonLayer infos={orqada} />
      </AbsoluteFill>
      <Shade />
      <BRollLayer list={p.broll} />
      <KineticLayer list={p.kinetic} />
      {p.cta ? (
        <Between a={p.cta.at} b={meta.duration + 1}>
          <SubscribeCard {...p.cta} />
        </Between>
      ) : null}
      {/* kinetik matn bilan takrorlanmasin: pastki subtitr faqat plan.captions === true bo'lsa */}
      {p.captions === true ? <Captions chunks={captions} top={MOTION_CAPTION_TOP} theme="motion" /> : null}
      <EndFade />
      <SfxLayer list={p.sfx} />
    </AbsoluteFill>
  );
};
