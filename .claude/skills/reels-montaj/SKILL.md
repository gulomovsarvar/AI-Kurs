---
name: reels-montaj
description: Vertikal 9:16 Reels/Shorts videoni Remotion'da montaj qiladi. Ikki format bor - "tutorial" (ekran yozuvi tepada, spiker pastda) va "ekspert-motion" (to'liq ekranli spiker, kinetik matn, B-roll, punch-in, obuna kartochkasi). Umumiy qismlar - NavaiSTT bilan o'zbekcha so'zma-so'z subtitr, SFX, -14 LUFS ovoz, HLG->SDR rang. Foydalanuvchi "montaj qil", "rils yasa", "videoni kesib ber", "subtitr qo'sh", "tutorial", "motion uslubida" desa ishlat.
---

# Reels montaj (Remotion, Windows)

Manba: montaj-skills (muallif Umid), Windows/PowerShell va ikki formatga moslab qayta yozilgan.

## 0. Birinchi qadam: formatni so'ra
Ishni boshlashdan oldin **AskUserQuestion** bilan so'ra (taxmin qilma):
- **tutorial** — ekran yozuvi tepada, spiker pastda; qadamlar, ro'yxat, prompt, chat sahnalari. Ekran yozuvi fayli kerak.
- **ekspert-motion** — spiker to'liq kadrda + kinetik matn + B-roll + punch-in + obuna kartochkasi. Qoidalar: `references/motion-uslub.md` (avval to'liq o'qi).

Shu bilan birga so'ra (agar aytilmagan bo'lsa): kirish videosi qaysi (`xom/` ichida), tutorial bo'lsa ekran yozuvi qaysi, CTA so'zi yoki @username.

## Papkalar (loyiha ildizi `D:\Ai-kurs`)
| Papka | Nima | git |
|---|---|---|
| `xom/` | kirish videolari (spiker, ekran yozuvi) | yo'q |
| `broll/` | B-roll video/rasmlar | yo'q |
| `montaj/` | ishchi Remotion loyiha (shu skill'dagi `template/` nusxasi) | yo'q |
| `montaj/public/` | talk.mp4, tut.mp4, meta.json, captions.json, plan.json, sfx/, broll/ | yo'q |
| `montaj/qa/` | src.wav, words.json, tekshiruv kadrlari | yo'q |
| `tayyor/` | yakuniy videolar | yo'q |
| `models/` | NavaiSTT modeli (~1.5 GB, bir marta yuklanadi) | yo'q |
| `.venv/` | Python 3.12 + faster-whisper | yo'q |
| `motion/KATALOG.md` | SFX va B-roll katalogi (`D:\motion uchun`) | ha |

Barcha buyruqlar PowerShell'da, `D:\Ai-kurs` dan. Skill papkasi: `$S = ".claude\skills\reels-montaj"`.

## 1. Bir martalik sozlash (bor bo'lsa o'tkazib yubor)
```powershell
node --version; ffmpeg -hide_banner -filters | Select-String zscale   # Node 20+ va zscale kerak
if (-not (Test-Path .venv)) { py -3.12 -m venv .venv; .venv\Scripts\python -m pip install faster-whisper }
if (-not (Test-Path montaj\package.json)) { Copy-Item -Recurse "$S\template\*" montaj\; Push-Location montaj; npm install; Pop-Location }
```
Shablon yangilangan bo'lsa: `montaj\src` ni `template\src` bilan almashtir (public/ ga tegma).

## 2. Tayyorlash (ikkala format uchun bir xil)
```powershell
.venv\Scripts\python "$S\scripts\tayyorla.py" --kirish xom\VIDEO.mp4 --loyiha montaj [--ekran xom\EKRAN.mp4] [--til uz]
```
- Rang: iPhone HLG bo'lsa avtomatik SDR'ga (zscale + tonemap hable); 1080x1920, 30 fps, markazdan kroplash.
- Subtitr: NavaiSTT (`scripts/words.py`), model `models/` ga tushadi. CUDA ishlamasa o'zi CPU ga o'tadi.
- Transkriptni o'qi va brend/ism xatolarini (Claude, RAW, Remotion) to'g'ridan-to'g'ri `public\captions.json` da tuzat. Skriptni qayta ishga tushirish shart emas.
- Davomiylik `public\meta.json` ga yoziladi; Remotion uni o'zi o'qiydi (qo'lda DURATION yozilmaydi).

## 3. Reja: `montaj\public\plan.json`
Transkriptni o'qib, vaqtlarni **soniyada** `words.json` dagi so'zlarga bog'lab yoz. Sxema: `template/src/types.ts`.

**tutorial** misoli:
```json
{ "format": "tutorial",
  "full": [[0, 3.2], [52, 60]],
  "island": { "at": 0.4, "out": 3.0, "text": "5 qadamda AI montaj" },
  "scenes": [
    { "type": "step", "a": 3.2, "b": 10, "n": 1, "title": "Papka oching", "shots": [{ "a": 3.2, "b": 10, "from": 4, "rate": 1.5, "x": 0, "y": 0, "w": 1200 }] },
    { "type": "list", "a": 10, "b": 18, "n": 2, "title": "Asboblar", "rows": [["Remotion", "kod bilan montaj", "remotion.dev"]] },
    { "type": "typed", "a": 18, "b": 26, "n": 3, "title": "Prompt", "lines": ["Videoni montaj qil", "9:16"] },
    { "type": "chat", "a": 26, "b": 34, "n": 4, "title": "Feedback", "bubbles": [{ "at": 26.5, "me": true, "text": "Shriftni kattalashtir" }, { "at": 27.6, "text": "Tayyor" }] }
  ],
  "cta": { "a": 52, "b": 60, "typeAt": 54, "word": "MONTAJ", "label": "Skill'larni yuboraman" },
  "sfx": [{ "at": 3.15, "file": "whoosh.wav", "vol": 0.16 }] }
```
- `shots`: x, y, w — ekran yozuvining **manba pikselida** kroplash; `from` — ekran yozuvidagi boshlanish soniyasi; zerikarli joyni `rate` 2–3.4 bilan tezlashtir.
- Har qadam uchun kadrni kontakt-varaqdan tanla: `ffmpeg -hide_banner -i montaj\public\tut.mp4 -vf "fps=1/2,scale=320:-1,tile=6x5" -frames:v 1 montaj\qa\tut_sheet.jpg` va Read bilan ko'r.
- Veb-kamera burchakda bo'lsa, kroplab chetlab o't (blur dog'dek ko'rinadi). Qorong'i/bo'sh ekran kadrini uzoq ushlama.
- Ro'yxat 7 qatordan oshmasin; sig'masa shriftni emas, matnni qisqart.

**ekspert-motion** misoli (motion-uslub.md qoidalari: har 1,5–3 s da yangi vizual hodisa, har gapdan 1–3 kalit so'z, bitta aksent #96DF01):
```json
{ "format": "ekspert-motion",
  "punch": [{ "a": 4.1, "b": 6.0, "scale": 1.18 }],
  "kinetic": [
    { "at": 0.2, "out": 2.4, "type": "katta", "sub": "siz hali ham", "main": "QO'LDAMI?", "rang": "laym" },
    { "at": 2.4, "out": 3.6, "type": "plashka", "sub": "har kuni", "main": "3 SOAT" },
    { "at": 6.0, "out": 8.5, "type": "hisob", "sub": "daromad", "from": 20, "to": 4000, "prefix": "$" },
    { "at": 9.0, "out": 12.0, "type": "royxat", "items": ["MUAMMO", "YECHIM", "NATIJA"] },
    { "at": 12.5, "out": 15.0, "type": "eski-yangi", "old": "QO'LDA", "main": "AVTOMAT" },
    { "at": 15.0, "out": 17.0, "type": "arvoh", "main": "AI" }
  ],
  "broll": [
    { "a": 17.0, "b": 19.5, "kind": "video", "src": "broll/klip.mp4", "from": 2 },
    { "a": 21.0, "b": 22.0, "kind": "grafik", "sub": "asosida", "main": "MEZON" }
  ],
  "cta": { "at": 26.0, "username": "@USERNAME", "name": "Sarvar" },
  "sfx": [{ "at": 0.2, "file": "pop.wav", "vol": 0.22 }] }
```
- **Bitta matn qatlami**: ekspert-motion'da pastki so'zma-so'z subtitr sukut bo'yicha O'CHIQ, chunki kinetik matn bilan ikki marta ko'rinadi. Foydalanuvchi so'rasagina `"captions": true` qo'y.
- **Ierarxiya** (eng muhim qoida):
  - Har gapda **bitta `katta`** so'z: avtomatik ekran kengligining ~82% iga moslanadi (70–90%), qalin condensed, `"rang": "oq"` (default) yoki `"laym"`. Qisqa so'z ham to'liq kenglikni egallaydi.
  - `plashka` — faqat **ikkinchi darajali** kalit so'zlar (bitta gapda katta so'zdan keyin).
  - `sub` (yordamchi so'zlar): **ko'rinadigan harf balandligi** kamida 42px (`SUB_MIN`). Shrift o'lchami bilan adashtirma — kichik harfli Inter 46px ekranda ~24px ko'rinadi. Shuning uchun sub: Oswald 400, katta harf, 62px (`SUB_SIZE`) → harf balandligi ~45px. Tekshiruv: to'liq o'lchamdagi still'da harf qatorini piksel bilan o'lcha.
- **Hisoblagich** (`hisob`): sanash 0,4–1,2 s, keyin oxirgi qiymatda **kamida 0,8 s** turadi, keyin yo'qoladi. `out - at` kamida 1,5 s bo'lsin; qisqa bo'lsa kod `out` ni o'zi uzaytiradi (keyingi matn bilan ustma-ust tushmasligini tekshir). Eni oxirgi qiymat bo'yicha moslanadi.
- Hook (birinchi 0,5 s): `katta` savol yoki raqam hisoblagich.
- Kinetik matn turlari: `katta`, `plashka`, `hisob`, `royxat`, `eski-yangi`, `arvoh`. `y` bilan joyini o'zgartir — **yuzni to'smasin**: avval kontakt-varaqda yuz qayerdaligini ko'r (to'liq bo'y kadrda odatda y 900–1100).
- **B-roll tartibi**:
  1. Avval `motion/KATALOG.md` → "B-roll nomzodi" qatorlaridan **videoning umumiy mavzusiga** mosini qidir (bitta so'zga emas: "kasb" so'zi bor deb ta'lim videosiga tikuvchilik andozasini qo'yma). Klip shu videoning mavzusini to'g'ridan-to'g'ri ko'rsatishi kerak.
     KATALOG dagi kliplar **boshqa loyihalardan** — ishlatishdan oldin foydalanuvchidan **so'ra** (AskUserQuestion: qaysi gapga qaysi klip). Tasdiqlansa, `montaj\public\broll\` ga nusxala, `kind: "video"` / `"image"`.
  2. Mos klip bo'lmasa yoki foydalanuvchi rad etsa — B-roll'ni majburlama: spiker kadri + kinetik matn qolsin. Kerak bo'lsa **zaxira**: `kind: "grafik"` (qora gradient + grid + katta laym so'z).
  3. Yangi klipni ko'rib chiqqach, mazmunini `motion/broll_tavsif.json` ga yoz va `python -I motion\katalog.py "D:/motion uchun"` ni qayta ishga tushir.
- **Obuna kartochkasi**: foydalanuvchi username bermagan bo'lsa `"username": "@USERNAME"` qo'y va javobda "o'zingiznikiga almashtiring" deb eslat.
- Brend tasvirlarini (birovning logotipi, mashhur OS fonlari) nusxalama.
- **`orqada`** — katta so'z odam orqasida (bosh/soch/yelka so'zni qisman to'sadi). Rejada: `{ "at": 1.48, "out": 2.56, "type": "orqada", "main": "KASB", "rang": "laym" }` — `y` yozma, balandlik avtomatik (bosh tepasi va yelka orasi, `ORQADA_CENTER`). Plan yozilgach **albatta** ishga tushir:
  ```powershell
  .venv\Scripts\python "$S\scripts\orqada.py" --loyiha montaj
  ```
  - RobustVideoMatting (ONNX, `models\rvm\`, yo'q bo'lsa o'zi yuklaydi); CUDA bo'lsa GPU, bo'lmasa CPU (~0,4 s/kadr).
  - Faqat `orqada` oraliqlari hisoblanadi (+0,5 s isinish, kontur barqaror bo'lishi uchun) → `public\orqada\<kalit>\*.png` + `public\orqada.json`.
  - Kesh: kalit = talk.mp4 mazmuni + oraliq + model; o'zgarmagan bo'lsa "keshdan" deydi. `tayyorla.py` qayta ishlasa yoki oraliq vaqti o'zgarsa — qayta hisoblanadi.
  - Qatlamlar: asl video → orqada so'zi → faqat odam (alfa, bir xil punch-in va rang filtri) → boshqa matnlar.
  - Tekshiruv: oraliqdan 4 ta still, soch chekkasini 3x kattalashtirib ko'r (yashil "halo" yoki kesilgan soch bo'lmasin).
  - Yaqin plan (bosh katta) kadrda effekt kuchliroq; to'liq bo'y kadrda faqat so'z o'rtasi to'siladi.

## 3b. orqada niqoblari (faqat ekspert-motion, plan.json da "orqada" bo'lsa)
```powershell
.venv\Scripts\python "$S\scripts\orqada.py" --loyiha montaj
```
Yo'q bo'lsa ham ishlatish xavfsiz: bo'sh `orqada.json` yozadi.

## 4. SFX (ikkala format)
- Manba: `motion/KATALOG.md` (rollar: whoosh, pop, click, typing, tick, riser, glitch...). Katalog yo'q yoki eskirgan bo'lsa: `python -I motion\katalog.py "D:/motion uchun"`.
- Kerakli fayllarni `montaj\public\sfx\` ga **nusxala** (asl joyidan ko'chirma), `plan.json` da `file` — shu nom.
- Qoida: whoosh — sahna/qadam almashganda; pop — matn/kartochka paydo bo'lganda; click — tugma/kursor/obuna; typing — matn yozilganda; tick — hisoblagich. Ovoz balandligi 0,14–0,3.
- Musiqa: tutorial'da odatda yo'q. Kerak bo'lsa yoki ekspert-motion'da (reference'larda fon musiqasi bor), foydalanuvchidan kayfiyatini so'ra va Openverse'dan ol:
  `.venv\Scripts\python "$S\scripts\openverse_audio.py" "calm ambient" --music --min 30 --get 3 --out montaj\public\music` (CC BY bo'lsa, muallifni ATTRIBUTION.txt dan video tavsifiga yoz). `ES_` (Epidemic Sound) fayllar obunasiz tijoriy ishlatilmaydi.

## 5. Renderdan oldin tekshiruv
```powershell
Push-Location montaj
npx tsc --noEmit
npx remotion still src/index.ts Tutorial qa/kadr_5s.png --frame=150 --scale=0.4   # har sahnadan bittadan kadr
Pop-Location
```
Kadrlarni Read bilan ko'r: matn yuzni to'smayaptimi, kroplash to'g'rimi, subtitr o'qiladimi.

## 6. Render va yakun (ikkala format uchun bir xil)
```powershell
Push-Location montaj
npx remotion render src/index.ts Tutorial export/raw.mp4 --crf=16      # yoki EkspertMotion
Pop-Location
.venv\Scripts\python "$S\scripts\yakunla.py" --kirish montaj\export\raw.mp4 --chiqish tayyor\NOM.mp4
```
`yakunla.py`: 2 o'tishli loudnorm -14 LUFS, `-crf 21`, natijaning LUFS qiymati va hajmi (Telegram uchun < 50 MB).

## Muammolar
- `node` topilmasa: Node o'rnatilganini va PATH'da ekanini tekshir (`node --version`).
- ffmpeg filtrida disk harfi (`D:/...`) yozma — `:` ajratuvchi; nisbiy yo'l ishlat.
- PowerShell 5.1 da ffmpeg stderr'ini `2>&1` bilan o'rama — xato deb ko'rsatadi.
- Video va audio `@remotion/media` dagi `<Video>`/`<Audio>` bilan qo'yiladi (`OffthreadVideo` Windows'da "No frame found at position" xatosini berdi). `trimBefore` kadrda; plan.json da `from` soniyada beriladi, kod o'zi aylantiradi.
- Barcha `remotion` va `@remotion/*` paketlari bir xil versiyada bo'lsin (hozir 4.0.537, `^` belgisisiz) — aks holda render "Version mismatch" bilan to'xtaydi.
- NavaiSTT GPU'da ishlashi uchun CUDA 12 cuBLAS/cuDNN kerak; yo'q bo'lsa `words.py` o'zi CPU ga o'tadi (sekinroq, lekin ishlaydi).
- Birinchi render Chrome Headless Shell'ni yuklaydi (~100 MB) — internet kerak.
