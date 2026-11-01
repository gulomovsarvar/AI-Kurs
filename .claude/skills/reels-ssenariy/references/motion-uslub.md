# Motion uslubi: "Kinetik matn + retro B-roll"

## Manba
1 ta reference (50 soniya, 9:16, 30 fps): ekspert kameraga gapiradi, ustiga motion grafika va AI/3D sahnalar qo'yilgan.
O'lchovlar ffmpeg bilan olingan. Animatsiya turlari kadrlarga qarab aniqlangan, shuning uchun ular "taxminan".

## Tuzilma
- **A-roll** (taxminan 60%): ekspert divanda, o'rta yoki yaqin plan, gapiradi.
- **B-roll** (taxminan 40%): to'liq ekranli sahnalar, gapdagi g'oyani vizual ko'rsatadi:
  - retro kompyuter (CRT monitor) turgan qorong'i xonalar
  - ochiq osmon va yashil tepalik foni (retro OS estetikasi)
  - retro oyna elementlari: Notepad oynasi, "System message" dialogi, papka ikonalari va sichqoncha kursori
  - ro'yxat raqamlari ("1", "2", "3") sahna ichida katta 3D raqam bo'lib turadi
  - pul yomg'iri, osilib turgan telefon trubkasi kabi metafora obyektlari
- Qoida: **har 2–4 soniyada ekranda nimadir o'zgaradi** (kesish, yangi matn yoki B-roll). Sahna kesishlari 17 ta, o'rtacha 2,8 s; matn animatsiyalari esa bundan ham tez-tez.

## Kinetik matn (eng muhim element)
- Subtitr emas, **dizayn**: har gapdan 1–3 kalit so'z ekranga chiqadi, butun gap emas.
- Ierarxiya: asosiy so'z juda katta va qalin ("top", "uchun", "$4000"), yordamchi so'zlar kichik va ingichka, tepada yoki pastda.
- Shrift: qalin, tor (condensed) sans-serif, oq.
- **Aksent rangi: laym-yashil, taxminan #96DF01.** Kalit so'z shu rangdagi plashka ichida, matn qora.
- Animatsiyalar (kadrlar bo'yicha):
  - so'zlar birma-bir paydo bo'ladi (nutq bilan sinxron)
  - raqam hisoblagich: "$20" → "$200" → "$4000"
  - katta so'z ekspert orqasida turadi (odam matn oldida, ya'ni "chuqurlik" effekti)
  - xira holatdan aniq holatga o'tish (blur-in), kichik siljish
  - ro'yxat tugmalari birma-bir tushadi ("MUAMMOSI NIMADA?" va boshqalar)
  - "eski" va "yangi" holat: eski so'z o'chirilgan yoki xira, yangisi yashil plashkada
- Emoji o'rniga o'z ikonkalari: $ belgisi, soat, papka, kursor. Hammasi aksent rangida.

## Rang
- A-roll: **qorong'i, iliq, kontrastli** fon (to'q kulrang, jigarrang). Ekspertning qizil kiyimi yagona yorqin rang bo'lib ajralib turadi.
- B-roll: ikki xil kayfiyat. Qorong'i retro xonalar va yorqin osmon fonlari navbatlashadi.
- Aksent: laym-yashil har bir sahnada takrorlanadi va brendni bog'lab turadi.

## O'tishlar
- A-roll ichida: oddiy kesish va **punch-in** (kadrni kattalashtirish), urg'u tushgan gapda.
- A-roll ↔ B-roll: tez kesish yoki matn orqali o'tish (matn ekranni to'ldiradi, keyin yangi sahna ochiladi).
- B-roll ichida: kamera sekin harakatlanadi (dolly/zoom). AI video yoki 3D render belgisi.

## Ovoz
- Nutq tekis va kuchli siqilgan: -14,2 LUFS, LRA 3,6 LU (juda tor diapazon, "podkast ovozi").
- SFX: Claude eshitmaydi. Kutiladigan joylar: matn paydo bo'lganda (pop, whoosh), raqam hisoblagichda (tick), oyna ochilganda (klik), pul tushganda.
  **Foydalanuvchi aniqlashtirsin:** fon musiqasi bormi va qanday kayfiyatda?

## Yakun (CTA)
- Oxirgi 3–4 soniya: ekspert gapira turib, kadrda kichik profil kartochkasi (avatar, @username, "Obuna" tugmasi bosiladi va "Rahmat" ga o'zgaradi).

## Agent uchun xulosa
1. Har gapdan 1–3 kalit so'z tanla va matn animatsiyasi turini belgila.
2. Har 3–5 soniyada A-roll'ni uzib, gap g'oyasini ko'rsatadigan B-roll qo'y.
3. Bitta aksent rang, bitta asosiy shrift. Butun video shu bilan bog'lanadi.
4. Raqamlar, ro'yxat va taqqoslash kabi gaplar har doim vizual ko'rsatilsin.
5. Har bir matn paydo bo'lishi va sahna almashishiga SFX qo'y.
6. B-roll'da birovning brend tasvirini (masalan mashhur OS fon rasmlarini) nusxalama. Shunga o'xshash, lekin original sahna yarat.

---

## Qo'shimcha reference'lardan (2026-11-01)
Manba: `D:\motion uchun\Reels_reference` dagi 7 video (r1–r7), `/reference-tahlil` usulida tahlil qilindi.
Hammasi 720×1280 (9:16); fps: 60 (r1, r4), 59.94 (r2), 30 (r3, r6, r7), 25 (r5).

### Raqamlar
| Video | Davomiylik | Kesishlar | O'rtacha | Median | LUFS | LRA | Rang |
|---|---|---|---|---|---|---|---|
| r1 | 45,4 s | 11 | 3,78 s | 2,78 s | -15,6 | 4,9 | yashil/laym |
| r2 | 19,3 s | 10 | 1,76 s | 1,33 s | -16,5 | 2,0 | oq-qora (monoxrom) |
| r3 | 8,0 s | 0 (bitta uzluksiz animatsiya) | — | — | -14,9 | 0,7 | qora + oq |
| r4 | 18,1 s | 0 (uzluksiz, kesishsiz) | — | — | -14,6 | 3,6 | binafsha |
| r5 | 17,9 s | 10 | 1,62 s | 1,52 s | -14,5 | 2,1 | qora/krem + qizil |
| r6 | 19,1 s | 13 | 1,37 s | 1,12 s | -14,3 | 3,2 | binafsha + oq |
| r7 | 77,6 s | 21 | 3,53 s | 2,77 s | -26,0 | 3,9 | qora + qizil |

### Asosiy farq (eski tahlilga nisbatan)
- **7 videoning birortasida ham gapiradigan odam (A-roll) yo'q.** Bular sof motion-grafika (kinetik tipografiya + obyektlar).
  Demak ekspert-motion formatida odam kadri — bizning qo'shimchamiz; bu reference'lar faqat **grafika qatlami** uchun namuna.

### Tasdiqlangan qoidalar (≥2 videoda)
- **Ikki og'irlikdagi matn**: kichik ingichka yordamchi so'z + katta qalin kalit so'z (r1–r7, hammasi). Eski "Ierarxiya" qoidasini tasdiqlaydi.
- **Bitta aksent rang butun videoda** (r1 yashil, r4/r6 binafsha, r5/r7 qizil, r2/r3 monoxrom). r1 ning laym-yashili #96DF01 ga juda yaqin.
- **Kalit so'z rangli plashkada** (r1 "Creator", r7 "waste", r6 "EVER WONDERED?").
- **So'zma-so'z paydo bo'lish, blur-in** (r1, r4, r5, r6, r7).
- **Katta xira "arvoh" so'z orqa fonda** (r2 "AI", r4, r6 "Motion Design") — "chuqurlik" effektining odamsiz varianti.
- **Raqam hisoblagich** hook'da (r7 "$842 → $1,000"); eski "$20 → $4000" qoidasini tasdiqlaydi.
- **Metafora obyektlari**: fonsiz kesilgan 3D/foto obyekt (miya, shaxmat, lampochka, ko'z, retro televizor, haykal, pul) — r2, r4, r5, r6, r7.
- **Telefon/UI maketlari** (Instagram profili, ilova oynasi) — r1, r2, r5, r7.
- **Yakun**: logotip yoki "Follow" kartochkasi (r1, r2, r4, r6, r7); profil kartochkasi (r5, r7). Eski CTA qoidasini tasdiqlaydi.

### Yangi topilmalar
- **Hook birinchi 0,5 s da matn bilan ochiladi**, ko'pincha murojaat yoki savol: "Are you a ___?", "Ever wondered?", "But your growth?" (r1, r5, r6). r1 da plashkadagi so'z almashib turadi (Freelancer → Solopreneur → Creator).
- **Fon**: tekis rang yoki yumshoq gradient + **ingichka to'r (grid)** chiziqlari (r4, r5, r6, r7); ba'zan ingichka egri chiziq yoki aylana kadrni kesib o'tadi (r4, r7).
- **Ikkinchi shrift — serif kursiv** (r4, r6): kalit so'z katta kursiv serif, yordamchi so'z oddiy sans. Eski "faqat tor sans-serif" qoidasiga muqobil.
- **Ro'yxat "baraban" usulida** (r3): so'zlar vertikal aylanadi, markazdagisi aniq va strelka bilan, qolganlari xira.
- **Ritm**: kesishli videolarda median 1,1–2,8 s; ikkita videoda (r3, r4) umuman kesish yo'q, harakat uzluksiz animatsiya bilan beriladi. "Tez montaj" (≥3 kadr <1 s) faqat r2 da bir marta.
- **Ovoz**: 6 ta videoda -14,3…-16,5 LUFS, LRA 0,7–4,9 (r7 -26 LUFS — istisno). Pauzalar deyarli yo'q (silencedetect 0–2) → ovoz uzluksiz, ehtimol **fon musiqasi** butun video davomida. Claude eshitmaydi, musiqa kayfiyatini foydalanuvchi aniqlashtirsin.

### Ekspert-motion formati uchun xulosa
1. Grafika qatlami (matn, plashka, obyekt, UI kartochka) odam kadri ustida yoki B-roll o'rnida to'liq ekranli "grafik sahna" sifatida.
2. Bitta aksent (#96DF01) + qora/oq; fon sahnalarida yumshoq gradient va ingichka grid.
3. Hook: 0,5 s ichida plashkali savol yoki raqam hisoblagich.
4. Har 1,5–3 s da yangi vizual hodisa (matn, obyekt yoki kesish).
