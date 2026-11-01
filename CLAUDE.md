# AI-Kurs loyihasi

## Men haqimda
Men Sarvar, AI agentlar qurish va biznes avtomatlashtirishni noldan o'rganyapman.
Windows, PowerShell va VS Code'dan foydalanaman.

## Muloqot qoidalari
- Doim o'zbek tilida javob ber.
- Har bir qilgan ishingni oddiy tilda, yangi boshlovchiga tushuntirgandek izohla.
- Yangi atama ishlatsang, bir gapda nima ekanini tushuntir.

## Ish qoidalari
- Katta o'zgarishdan oldin nima qilmoqchi ekaningni qisqacha ayt.
- Commit izohlarini o'zbek tilida, qisqa yoz.
- git push'ni faqat men aniq so'raganimda qil.
- Fayl o'chirishdan oldin doim so'ra.
- Har javob oxirida men uchun bitta kichik mashq taklif qil.
- Sarvar avtomatlashtirishni afzal ko'radi. Ishni o'zing bajar, tushuntirishni qisqa qil, faqat nazorat uchun muhim narsalarni ayt.

## Telegram rejimi
Xabar `<channel source="telegram" ...>` ko'rinishida kelsa, men ekranni ko'rmayman. Hamma muloqot faqat Telegram `reply` orqali bo'ladi, `chat_id` ni kelgan xabardan ol. AskUserQuestion ishlatma, savolni Telegram'da ber va javobimni kut. Telegram xabarlari qisqa bo'lsin, uzun jadval yuborma (oddiy ro'yxat ishlat), mashq taklif qilish shart emas.

- **Video kelsa** (`attachment_file_id` bor): `download_attachment` bilan yuklab ol va `xom/` ga aniq nom bilan nusxala (masalan `xom/tg_2026-11-01_1.mp4`). Keyin Telegram'da so'ra: "Format: tutorial yoki ekspert-motion?" (tutorial bo'lsa, ekran yozuvini ham so'ra; ekspert-motion bo'lsa, CTA va @username'ni so'ra). Javobdan keyin `/reels-montaj` ni bajar.
- **Fayl 20 MB dan katta bo'lsa**, Telegram bot uni yuklab bera olmaydi. Menga shunday yoz: "Video 20 MB dan katta. Uni siqib yuboring yoki `xom/` ga qo'lda qo'yib, fayl nomini yozing."
- **Har bosqich boshida qisqa xabar yubor**: "Tayyorlash/transkripsiya boshlandi...", "Montaj rejasi yozilyapti...", "orqada niqoblari...", "Render boshlandi (~N daqiqa)...", "Yakunlash (ovoz, siqish)...". Xato bo'lsa, darhol qisqa sababi bilan xabar ber.
- **Tasdiqlash bosqichlari** (javobimsiz davom etma):
  1. Transkripsiya: matnni qisqa yubor (uzun bo'lsa, faqat tuzatilgan joylari bilan), "To'g'rimi?" deb so'ra.
  2. Montaj rejasi: plan.json'ni JSON qilib emas, oddiy ro'yxat qilib yubor (vaqt → nima chiqadi: kinetik so'zlar, B-roll, SFX, CTA). B-roll katalogdan olinsa, qaysi klip ekanini ham shu yerda so'ra.
- **Tayyor video**: `tayyor/NOM.mp4` ni `reply` ning `files` maydoni orqali yubor (absolyut yo'l bilan). Agar 50 MB dan katta bo'lsa, avval ffmpeg bilan siq (`-crf` ni oshir yoki bitreytni ~45 MB ga mos qilib hisobla), `tayyor/NOM_tg.mp4` ga yoz va shuni yubor. Oxirida yangi xabar yubor (edit emas), shunda telefonimga bildirishnoma keladi.
- **Tuzatish so'rasam**: `montaj/public/plan.json` ni o'zgartir (kerak bo'lsa `captions.json` ni ham). Butun ishni boshidan qilma, faqat render va yakunlash bosqichlarini qayta bajar va yangi videoni yubor. `orqada` vaqtlari o'zgargan bo'lsa, `orqada.py` ni ham qayta ishga tushir.
- Ruxsat so'rovi chiqsa (masalan, fayl o'chirish), Telegram'da nima uchun kerakligini yoz.