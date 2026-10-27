# Ngủ Ngon — app (Expo)

Spec: `../docs/superpowers/specs/2026-10-20-sleep-gift-app-design.md` · Plan: `../docs/superpowers/plans/2026-10-25-app-foundation.md`

```bash
npm install
cp .env.example .env   # để localhost: khi dev app tự thay bằng IP LAN của máy chạy Expo
npx expo start         # điện thoại cùng Wi-Fi; API chạy ở ../api (cổng 3000)
npm test && npx tsc --noEmit && npx expo lint
```

- `src/app/` — màn hình (Expo Router), `src/lib/` — logic có test, `src/components/` — giao diện dùng chung (`night.tsx`, `moon-3d.tsx`).
