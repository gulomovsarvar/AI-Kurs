import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

// Ranglar. tutorial: Apple uslubidagi oq kartochkalar + yashil; ekspert-motion: laym aksent (motion-uslub.md)
export const C = {
  canvas: "#EDEDF1",
  canvasHi: "#F7F7F9",
  white: "#FFFFFF",
  ink: "#08080B",
  grey: "#8E8E93",
  greyLight: "#C7C7CC",
  fill: "#F2F2F5",
  green: "#20C47E",
  greenGlow: "rgba(32,196,126,0.55)",
  island: "#08080B",
  accent: "#96DF01", // ekspert-motion aksenti
  accentGlow: "rgba(150,223,1,0.45)",
};

export const SHADOW = "0 1px 2px rgba(8,8,11,0.04), 0 8px 24px rgba(8,8,11,0.06), 0 30px 80px rgba(8,8,11,0.10)";
export const SHADOW_SOFT = "0 1px 2px rgba(8,8,11,0.03), 0 10px 30px rgba(8,8,11,0.06)";

// Chiqish har doim 1080x1920, 30 fps (tayyorla.py kirish videoni shunga keltiradi).
// Davomiylik bu yerda YO'Q: u public/meta.json dan calculateMetadata orqali olinadi.
export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const font = loadInter("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
// fitText o'lchashidan oldin shrift yuklanganini kutish uchun loader ham eksport qilinadi
export const fontCondLoader = loadOswald("normal", { weights: ["400", "700"], subsets: ["latin", "latin-ext"] });
export const fontCond = fontCondLoader.fontFamily;

// Ierarxiya qoidalari (motion-uslub.md + foydalanuvchi tahlili)
export const BIG_WIDTH = 0.82; // "katta" so'z ekran kengligining 70-90% i (maqsad 82%)
export const SUB_MIN = 42; // yordamchi so'zlar kamida 42px
export const COUNTER_HOLD = 0.8; // hisoblagich oxirgi qiymatda kamida 0,8 s turadi

export const sec = (s: number) => Math.round(s * FPS);

// tutorial joylashuvi: ekran tepada (0–SPLIT_Y), spikerning videosi pastga suriladi
export const ISLAND_TOP = 120;
export const SPLIT_Y = 960;
export const TALK_SHIFT = 420;
export const CAPTION_TOP = 1625;
// ekspert-motion: subtitr pastroq, yuzni to'smasin
export const MOTION_CAPTION_TOP = 1480;
