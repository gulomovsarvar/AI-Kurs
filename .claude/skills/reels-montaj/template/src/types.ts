// public/ dagi JSON fayllar sxemasi. Barcha vaqtlar SONIYADA (kirish videosi boshidan).

export type Word = { t: string; s: number; e: number };

// tayyorla.py yozadi
export type Meta = {
  duration: number; // talk.mp4 davomiyligi, s
  talk: string; // odatda "talk.mp4"
  tut?: { file: string; w: number; h: number; duration: number }; // ekran yozuvi (faqat tutorial)
};

export type Sfx = { at: number; file: string; vol?: number }; // file: public/sfx/ ichidagi nom

// ---- tutorial ----
export type TutShot = { a: number; b: number; from: number; rate?: number; x: number; y: number; w: number };
export type TutScene =
  | { type: "step"; a: number; b: number; n?: number; title: string; shots: TutShot[] }
  | { type: "list"; a: number; b: number; n?: number; title: string; rows: [string, string, string?][] }
  | { type: "typed"; a: number; b: number; n?: number; title: string; lines: string[]; typeEnd?: number }
  | { type: "chat"; a: number; b: number; n?: number; title: string; bubbles: { at: number; me?: boolean; text: string }[]; chips?: string[] };

export type TutorialPlan = {
  format: "tutorial";
  full?: [number, number][]; // spiker to'liq kadrda bo'ladigan oraliqlar (hook, CTA)
  island?: { at: number; out: number; text: string };
  scenes?: TutScene[];
  cta?: { a: number; b: number; typeAt: number; word: string; label: string };
  sfx?: Sfx[];
  captions?: boolean;
};

// ---- ekspert-motion ----
export type Kinetic = {
  at: number;
  out: number;
  type: "katta" | "plashka" | "hisob" | "royxat" | "eski-yangi" | "arvoh" | "orqada"; // katta: har gapda bitta, ekran enining ~82%; plashka: ikkinchi darajali; orqada: katta so'z odam orqasida (orqada.py kerak)
  main?: string; // kalit so'z (katta)
  sub?: string; // yordamchi so'z (kichik)
  from?: number; // hisob: boshlang'ich son
  to?: number; // hisob: oxirgi son
  prefix?: string; // hisob: "$"
  suffix?: string;
  items?: string[]; // royxat
  old?: string; // eski-yangi: eski so'z
  y?: number; // vertikal joy, px (default 560)
  rang?: "oq" | "laym"; // katta/hisob rangi (katta: default oq, hisob: default laym)
};
export type BRoll = { a: number; b: number; kind: "video" | "image" | "grafik"; src?: string; from?: number; main?: string; sub?: string };

export type MotionPlan = {
  format: "ekspert-motion";
  punch?: { a: number; b: number; scale?: number }[];
  kinetic?: Kinetic[];
  broll?: BRoll[];
  cta?: { at: number; username: string; name?: string; avatar?: string };
  sfx?: Sfx[];
  captions?: boolean; // sukut: false (kinetik matn bor); true = pastki so'zma-so'z subtitr ham chiqadi
};

export type Plan = TutorialPlan | MotionPlan;

// orqada.py yozadi (public/orqada.json): odam niqobi kadrlari va bosh/yelka balandligi (manba pikselida, punch-in siz)
export type OrqadaInfo = { at: number; out: number; start: number; frames: number; dir: string; headTop: number; shoulderY: number; cx: number; headW: number };

export type ReelProps = { meta: Meta; captions: Word[][]; plan: Plan | null; orqada: OrqadaInfo[] };
