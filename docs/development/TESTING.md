# Testing

- `npm test` → unit (35).
- `npm run test:integration` → integrasi (28), butuh DATABASE_URL (postgres://bf:bf@127.0.0.1:55432/bf_test).
- `npm run test:e2e` → Playwright.
- Smoke: jalankan `npm run build && npm start`, lalu `BETTER_AUTH_SECRET=... npm run smoke` (secret harus sama dengan server).
- `npm run verify:release` → gerbang penuh.
