# 🌙 Ngủ Ngon

Nhật ký giấc ngủ cho **hai người**: một người ghi nhật ký mỗi sáng, một người đồng hành gửi lời chúc ngủ ngon và — nếu được đồng ý — xem nhật ký đó.

Mục tiêu sau 2–4 tuần: giờ dậy ổn định (lệch ≤ 30 phút, kể cả cuối tuần), chờ ngủ ngắn hơn, buổi sáng thấy khoẻ hơn.

| | |
| --- | --- |
| **App** | Expo SDK 58 · React Native 0.88 · Expo Router · SQLite · SecureStore · three.js (mặt trăng 3D) |
| **API** | NestJS 11 · Neon Postgres (SQL viết tay, không ORM) · deploy Vercel |
| **Yêu cầu** | Node.js 24 (`.nvmrc`), npm. `app/` và `api/` cài dependency riêng, không dùng monorepo tool |

## Tính năng

### Người ghi nhật ký

- Ghép đôi bằng mã kết nối 6 số; **tự chọn có chia sẻ hay không**, tắt được bất cứ lúc nào (server chặn, không chỉ app ẩn).
- Sàng lọc an toàn lúc đầu (lưu trên máy) · giờ dậy cố định.
- Nhật ký sáng ≤ 30 giây · cửa sổ ngủ tự điều chỉnh theo hiệu suất giấc ngủ · nhắc buổi tối.
- Trò chơi ru ngủ bằng giọng đọc, màn hình tối, tự dừng sau 20 phút — không điểm số, không thắng thua.
- Chạy offline, đồng bộ khi mở app.

### Người đồng hành

- Viết trước lời chúc cho các tối tới, khung cảnh riêng cho trò chơi.
- Xem biểu đồ 7/30 ngày khi được chia sẻ.

## Tiến độ

| Phase | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | API: auth, `/me`, logs, notes | ✅ 46/46 e2e trên Neon · ⏳ chưa deploy |
| 2 | App nền: onboarding, ghép đôi, cài đặt chia sẻ | ✅ code + unit test · ⏳ chưa thử trên iPhone, chưa build EAS |
| 3 | Nhật ký sáng, đồng bộ, cửa sổ ngủ, nhắc buổi tối | ✅ code + unit test · ⏳ chưa thử trên máy |
| 4 | Trò chơi ru ngủ | ✅ code + unit test · ⏳ chưa nghe thử giọng vi-VN trên iPhone |
| 5 | Màn người đồng hành | ✅ code + unit test · ⏳ chưa thử trên máy |
| 6 | Hoàn thiện & cài lên máy | — |

## Chạy local

**1. API** — terminal thứ nhất:

```powershell
cd api
npm ci
Copy-Item .env.example .env   # điền DATABASE_URL (Neon) và ADMIN_SECRET (≥ 32 ký tự ngẫu nhiên)
npm run migrate
npm run start:dev             # http://localhost:3000
```

**2. App** — terminal thứ hai:

```powershell
cd app
npm ci
Copy-Item .env.example .env   # giữ EXPO_PUBLIC_API_URL=http://localhost:3000
npx expo start
```

Điện thoại và máy tính cùng Wi‑Fi. Khi dev, app **tự thay `localhost` bằng IP LAN** của máy chạy Expo — đổi mạng không cần sửa `.env`. Nếu điện thoại không gọi được API, cho Node qua Windows Firewall (mạng Private, cổng 3000).

## Biến môi trường

| Biến | Ở đâu | Ghi chú |
| --- | --- | --- |
| `DATABASE_URL` | `api/.env` | Kết nối Neon. **Không bao giờ** đưa vào app |
| `ADMIN_SECRET` | `api/.env` | Người đồng hành nhập khi đăng ký |
| `EXPO_PUBLIC_API_URL` | `app/.env` | Dev: `http://localhost:3000` · build: URL `https` của Vercel. Mọi biến `EXPO_PUBLIC_*` đều công khai trong app |

Mọi file `.env*` (trừ `.env.example`) đã được gitignore.

## Kiểm thử

```powershell
# API
cd api
npm test -- --runInBand
npm run test:e2e -- --runInBand   # cần api/.env.test trỏ tới branch Neon riêng — test sẽ reset DB
npm run lint -- --no-fix

# App
cd app
npm test                          # API client, điều hướng onboarding, tính giờ
npm run typecheck
npm run lint
```

## Cấu trúc

```text
api/               NestJS — mỗi tài nguyên một module (auth, me, logs, notes)
  migrations/      file .sql, chạy bằng npm run migrate
  README.md        hợp đồng API chi tiết cho mobile
app/
  src/app/         màn hình (Expo Router)
  src/lib/         API client, SQLite, logic có unit test
  src/components/  giao diện dùng chung (night.tsx) · mặt trăng 3D (moon-3d.tsx)
```

## Cài lên iPhone

Cài qua EAS internal distribution (Ad Hoc), không qua App Store. Cần tài khoản Expo + Apple Developer và API đã deploy (bản release chặn `http://`):

```powershell
cd app
npx eas-cli@latest login
npx eas-cli@latest device:create                      # mở link trên iPhone để đăng ký UDID
npx eas-cli@latest build --platform ios --profile preview
```

Dự phòng Android: `npx eas-cli@latest build -p android --profile preview` (ra APK).

## Lưu ý

- Apple Developer hết hạn khoảng **06–07/2027** — gia hạn trước ~1 tháng, nếu không app trên máy sẽ ngừng mở.
- OTA (`expo-updates`) chỉ cập nhật JS; thêm thư viện native phải build và cài lại.
- `npm audit` của app còn cảnh báo mức high trong chuỗi công cụ Expo (`node-forge`, `zod`); bản sửa npm đề xuất là hạ về SDK 44 nên chưa áp dụng. Rà lại trước khi phát hành.
- App không thay thế bác sĩ: mất ngủ kéo dài trên 3 tháng hoặc có triệu chứng trong phần sàng lọc thì nên đi khám.
