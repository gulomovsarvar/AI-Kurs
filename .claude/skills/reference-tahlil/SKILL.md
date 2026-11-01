---
name: reference-tahlil
description: videolar/ papkasidagi reference Reels videolarni ffmpeg bilan tahlil qilib, umumiy uslubni reels-ssenariy skill'ining references/uslub.md fayliga yozadi.
disable-model-invocation: true
---

# Reference videolar tahlili

Maqsad: `videolar/` dagi reference videolardan (v1.mp4, v2.mp4, ...) takrorlanadigan
montaj uslubini aniqlash va uni `.claude/skills/reels-ssenariy/references/uslub.md` ga yozish.

> `disable-model-invocation: true` — bu skill faqat foydalanuvchi `/reference-tahlil` deb
> chaqirganda ishlaydi. Sabab: tahlil og'ir (ffmpeg, rasmlar) va uslub.md ni o'zgartiradi,
> shuning uchun o'z-o'zidan ishga tushmasligi kerak.

## Umumiy qoidalar (sabablari bilan)

1. **Buyruqlarni loyiha ildizidan (`D:\Ai-kurs`) Bash tool orqali ishga tushir.**
   Sabab: PowerShell 5.1 ffmpeg'ning stderr chiqishini xato (NativeCommandError) qilib o'raydi,
   ffmpeg esa barcha tahlil natijasini aynan stderr'ga yozadi.
2. **`-v error` / `-loglevel error` ISHLATMA. Uning o'rniga `-hide_banner` ishlat.**
   Sabab: scene, ebur128 va silencedetect natijalari `info` darajasida chiqadi; `-v error`
   ularni butunlay yashiradi va tahlil "bo'sh" bo'lib qoladi. `-hide_banner` faqat keraksiz
   versiya/kompilyatsiya ma'lumotini olib tashlaydi.
3. **Filtr ichidagi fayl yo'liga disk harfini yozma (`D:/...` emas, `tahlil/v1_scenes.txt`).**
   Sabab: ffmpeg filtrlarida `:` — parametr ajratuvchisi. `file=D:/...` dagi `:` yo'lni
   ikkiga bo'lib yuboradi va filtr xato beradi yoki faylni noto'g'ri joyga yozadi.
   Shuning uchun nisbiy yo'l + loyiha ildizidan ishga tushirish.
4. **Barcha oraliq natijalar `tahlil/` ga yoziladi.** Sabab: u `.gitignore` da, katta/vaqtinchalik
   fayllar git tarixiga tushmaydi.
5. **Raqamlarni o'zing hisobla, taxmin qilma.** Sabab: uslub.md keyin ssenariy yozishda qoida
   bo'lib xizmat qiladi — noto'g'ri raqam butun uslubni buzadi.

## 1-qadam: videolar ro'yxati

```bash
ls videolar/*.mp4
```
Agar 2 tadan kam video bo'lsa — to'xta va foydalanuvchiga ayt (uslub uchun kamida 2 video kerak, 6-qoidaga qara).

## 2-qadam: ffprobe — davomiylik, o'lcham, fps

```bash
ffprobe -hide_banner -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of default=nw=1 videolar/v1.mp4 2>&1 | grep -E "codec_type|width|height|r_frame_rate|duration"
```
Sabab: davomiylik keyingi hisoblarda (oxirgi kadr uzunligi, contact sheet fps) kerak;
o'lcham (9:16 yoki yo'q) va fps montaj sifatini ko'rsatadi. Audio oqimi yo'q bo'lsa — 5-qadamni o'tkazib yubor.

## 3-qadam: scene detection — kesishlar va ritm

```bash
ffmpeg -hide_banner -i videolar/v1.mp4 -vf "select='gt(scene,0.25)',metadata=print:file=tahlil/v1_scenes.txt" -an -f null - 2>/dev/null
```
- `gt(scene,0.25)` — kadrlar orasidagi farq 25% dan katta bo'lsa, kesish deb hisoblanadi.
  Sabab: 0.25 Reels uchun yaxshi muvozanat — 0.4 tez/yumshoq kesishlarni o'tkazib yuboradi, 0.1 esa kamera harakatini ham kesish deb sanaydi.
- `metadata=print:file=...` — natija faylga yoziladi. Sabab: terminal chiqishi uzun va aralash, fayldan aniq o'qiladi.
- `2>/dev/null` bu yerda mumkin, chunki natija faylga ketadi (bu `-v error` emas).

Statistika (DUR = 2-qadamdagi davomiylik):
```bash
DUR=99.23
awk -v D=$DUR '/pts_time/{split($3,a,":"); t[n++]=a[2]+0}
END{p=0; for(i=0;i<n;i++){L[i]=t[i]-p; p=t[i]} L[n]=D-p; m=n+1;
 s=0; for(i=0;i<m;i++){s+=L[i]; S[i]=L[i]} asort(S);
 med=(m%2)?S[(m+1)/2]:(S[m/2]+S[m/2+1])/2;
 printf "kesishlar=%d kadrlar=%d ortacha=%.2fs median=%.2fs\n", n, m, s/m, med;
 st=0; c=0; for(i=0;i<=m;i++){ if(i<m && L[i]<1.0){ if(c==0) st=(i==0?0:t[i-1]); c++ } else { if(c>=3) printf "tez montaj: %.1fs - %.1fs (%d kadr <1s)\n", st, (i==0?0:t[i-1]), c; c=0 } } }' tahlil/v1_scenes.txt
```
- **Median** ham hisoblanadi. Sabab: bitta uzun kadr o'rtachani buzadi, median haqiqiy ritmni ko'rsatadi.
- **Tez montaj oralig'i** = ketma-ket kamida 3 ta kadr 1 s dan qisqa. Sabab: Reels'da tezlik
  "portlashlari" (odatda hook yoki kulminatsiyada) uslubning muhim belgisi.

## 4-qadam: contact sheet — rasmlarni o'zing ko'r

Hook (birinchi 6 s, 12 kadr):
```bash
ffmpeg -hide_banner -y -i videolar/v1.mp4 -t 6 -vf "fps=2,scale=270:-1,tile=6x2" -frames:v 1 tahlil/v1_hook.jpg
```
Butun video (8x4 = 32 kadr, teng taqsimlangan):
```bash
ffmpeg -hide_banner -y -i videolar/v1.mp4 -vf "fps=32/$DUR,scale=240:-1,tile=8x4" -frames:v 1 tahlil/v1_sheet.jpg
```
So'ng **Read tool bilan ikkala rasmni och va o'zing ko'rib tahlil qil.**
Sabab: matn joylashuvi, rang, kamera rakursi kabi narsalarni ffmpeg raqamlari bermaydi — faqat ko'z bilan aniqlanadi.
Hook alohida olinadi, chunki birinchi soniyalar tomoshabin qoladimi-yo'qmi hal qiladi.

## 5-qadam: ovoz — ebur128 va silencedetect

```bash
ffmpeg -hide_banner -i videolar/v1.mp4 -vn -af "ebur128,silencedetect=noise=-35dB:d=0.3" -f null - 2> tahlil/v1_audio.txt
grep -A12 "Summary:" tahlil/v1_audio.txt
grep -E "silence_(start|end)" tahlil/v1_audio.txt
```
- **ebur128** — umumiy balandlik (I, LUFS) va dinamika (LRA). Sabab: Reels odatda -14 LUFS atrofida; LRA kichik bo'lsa — siqilgan, "baland" ovoz.
- **silencedetect** (-35 dB, 0.3 s) — pauzalar. Sabab: pauzalar nutq ritmini va "jim urg'u" usulini ko'rsatadi.
- Natija faylga yoziladi (`2>`), chunki ebur128 har 0.1 s da qator chiqaradi — terminalni to'ldirib yuboradi.

Har bir video uchun 2–5 qadamlarni takrorla (`v1` → `v2` → `v3`).

## 6-qadam: 7 element bo'yicha solishtirish

Har video uchun quyidagilarni yoz, keyin solishtir:

| Element | Nimaga qaraladi | Manba |
|---|---|---|
| Hook | birinchi 1–3 s da nima bo'ladi: savol, harakat, matn, yuz | hook contact sheet, scenes |
| Ritm | kesishlar soni, o'rtacha/median kadr, tez montaj joylari | 3-qadam |
| O'tishlar | keskin kesish, zoom, swipe, fade | contact sheet, scene_score |
| Matn | bor/yo'q, joylashuv, hajm, subtitr uslubi | contact sheet |
| Rang | iliq/sovuq, kontrast, yorqinlik | contact sheet |
| Kamera | yaqin/o'rta/umumiy plan, harakat, selfi/tripod | contact sheet |
| Ovoz | LUFS, LRA, pauzalar, musiqa/nutq | 5-qadam |

**Qoida: faqat kamida 2 videoda takrorlangan narsa "uslub" deb olinadi.**
Sabab: bitta videodagi narsa tasodif yoki shu mavzuga xos bo'lishi mumkin; takrorlanish esa muallifning ongli uslubini ko'rsatadi.
Faqat bitta videoda uchragan narsalarni alohida "Kuzatuvlar (uslub emas)" bo'limiga yoz.

## 7-qadam: uslub.md ga yozish

Manzil: `.claude/skills/reels-ssenariy/references/uslub.md`

- **Fayl mavjud bo'lsa, ustidan yozishdan oldin foydalanuvchidan so'ra** (AskUserQuestion: ustidan yozish / oxiriga qo'shish / bekor qilish).
  Sabab: unda qo'lda yozilgan uslub qoidalari bo'lishi mumkin — so'ramasdan o'chirib yuborish ularni yo'qotadi.

Fayl tuzilishi:
```markdown
# Uslub (reference videolar tahlili, <sana>)
Manba: v1.mp4, v2.mp4, v3.mp4 — <davomiyliklar>

## Raqamlar
| Video | Davomiylik | O'lcham/fps | Kesishlar | O'rtacha | Median | LUFS | LRA |

## Uslub qoidalari (≥2 videoda takrorlangan)
### Hook
### Ritm
### O'tishlar
### Matn
### Rang
### Kamera
### Ovoz
(har qoidada qaysi videolarda uchragani: masalan "(v1, v3)")

## Kuzatuvlar (uslub emas — faqat 1 videoda)

## Ssenariy uchun amaliy xulosa
- 3–6 ta qisqa ko'rsatma: ssenariy yozganda nima qilish kerak
```
Sabab: oxirgi bo'lim reels-ssenariy skill'i to'g'ridan-to'g'ri ishlatishi uchun.

Oxirida foydalanuvchiga qisqa xulosa ber: nechta video, asosiy 3–5 uslub qoidasi, fayl yo'li.
