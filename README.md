# uygulama zamanı

Discord bot doğrulama sistemi (Vercel üzerinde çalışır).

## Kurulum
1. Vercel'de projeyi GitHub reposundan bağla.
2. Storage → KV ekle (KV_REST_API_URL ve KV_REST_API_TOKEN otomatik gelir).
3. Environment Variables: DISCORD_PUBLIC_KEY ekle.
4. Discord Developer Portal'da URL'leri ayarla:
   - Interactions: https://proje-adin.vercel.app/api/interactions
   - Terms: https://proje-adin.vercel.app/terms.html
   - Privacy: https://proje-adin.vercel.app/privacy.html

## Endpoint'ler
- POST /api/create-bot  -> { name, owner } gönderir, secretKey ve webKey döner
- POST /api/verify      -> { secretKey, webKey } gönderir, { valid } döner
- POST /api/interactions -> Discord etkileşimleri

Anahtarlar hiçbir zaman koda veya repoya yazılmamalıdır.
