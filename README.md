# PaxtaForge — Telegram-style Gift Upgrade

Telegram'dagi sovg'a upgrade tizimining nusxasi: 123 ta haqiqiy kolleksiya (Durov's Cap, Plush Pepe, Resistance Dog, Heart Locket va h.k.).

## Nima haqiqiy (Fragment'dan olingan)
- Har bir kolleksiyaning **upgrade qilinmagan** (oddiy) sovg'a rasmi
- Haqiqiy **modellar** (animatsiyali `.tgs`), **fonlar** (markaz/chet ranglari bilan) va **simvollar** (naqsh)
- Har bir model/fon/simvolning **haqiqiy kamyoblik foizi** — upgrade natijasi shu taqsimot bo'yicha tanlanadi
- Kolleksiya supply'si (masalan Plush Pepe 2,861, Resistance Dog 843)

## Ishga tushirish
```bash
npm install
node scripts/scrape-fragment.js   # ma'lumotlarni yangilash (ixtiyoriy, data/ allaqachon bor)
node server.js                    # http://localhost:4000
```

## Narxlar
Telegram eski sovg'alarning Stars narxini ochiq e'lon qilmaydi, shuning uchun narxlar supply bo'yicha
darajalangan (`server.js` → `pricesFor`). Alohida sovg'a narxini `data/pricing.json` orqali belgilang:
```json
{ "plushpepe": { "base": 1200, "upgrade": 400 } }
```

## Eslatma
Bu mustaqil platforma: sovg'alar va Stars shu loyiha ichida hisoblanadi, haqiqiy Telegram aktivlari emas.
