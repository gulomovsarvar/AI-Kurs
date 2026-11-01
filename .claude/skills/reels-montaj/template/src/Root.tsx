import React from "react";
import { Composition } from "remotion";
import { loadReel } from "./common";
import { EkspertMotion } from "./motion/EkspertMotion";
import { FPS, H, W } from "./tokens";
import { Tutorial } from "./tutorial/Tutorial";
import type { ReelProps } from "./types";

// Ikki format, bitta ma'lumot manbasi (public/meta.json, captions.json, plan.json).
// durationInFrames bu yerda vaqtinchalik: haqiqiysini loadReel kirish videosidan hisoblaydi.
const defaults: ReelProps = { meta: { duration: 1, talk: "talk.mp4" }, captions: [], plan: null, orqada: [] };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Tutorial" component={Tutorial} durationInFrames={FPS} fps={FPS} width={W} height={H} defaultProps={defaults} calculateMetadata={loadReel} />
    <Composition id="EkspertMotion" component={EkspertMotion} durationInFrames={FPS} fps={FPS} width={W} height={H} defaultProps={defaults} calculateMetadata={loadReel} />
  </>
);
