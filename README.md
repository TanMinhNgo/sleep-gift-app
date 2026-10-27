# Sleep Gift

Ứng dụng Expo/React Native và API NestJS theo thiết kế trong `docs/superpowers/`.
Hiện tại là bộ khung phát triển, chưa triển khai các tính năng nghiệp vụ.

## Yêu cầu

- Node.js 24, npm (xem `.nvmrc`).
- Hai thư mục cài dependency độc lập, không dùng monorepo tool.

## API

```powershell
cd api
npm ci
Copy-Item .env.example .env
npm run start:dev
```

API mẫu chạy tại `http://localhost:3000`. `DATABASE_URL` và `ADMIN_SECRET` trong
`.env` dành cho bước triển khai nghiệp vụ; khung mẫu chưa dùng database hay auth.
Không đưa connection string Neon hoặc admin secret vào app.

API dùng NestJS 11 để khớp Jest trong kế hoạch và Node 24.10 hiện có.
Override `multer` lên dòng 2.5 đã vá lỗi DoS; bỏ override khi NestJS tự dùng bản đã vá.

```powershell
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run lint -- --no-fix
```

## App

Mở terminal khác từ thư mục gốc:

```powershell
cd app
npm ci
Copy-Item .env.example .env
npm start
```

`EXPO_PUBLIC_API_URL` phải là địa chỉ API mà thiết bị truy cập được. Với điện thoại
thật, dùng IPv4 Wi-Fi của máy chạy API, ví dụ `http://192.168.1.10:3000`;
`localhost` trên điện thoại trỏ về chính điện thoại. Khi deploy dùng HTTPS.
Mọi biến `EXPO_PUBLIC_*` đều công khai trong app.

```powershell
npm run typecheck
npm run lint
npx expo-doctor
```

Jest (`jest-expo`) đã cấu hình cho app; `npm test` dùng khi bắt đầu thêm test nghiệp vụ.
Các test mẫu trong API chỉ kiểm tra bộ khung NestJS.

App dùng Expo SDK 58 và hướng development build. Trên Windows, build iOS qua EAS;
cần tài khoản Expo và Apple Developer khi cấu hình ký/cài iPhone:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

Chưa liên kết tài khoản EAS, Neon hoặc Vercel. Cấu hình OTA (`eas update:configure`)
thực hiện sau khi liên kết dự án EAS. Chưa có migration/schema hoặc API nghiệp vụ.

Lúc cài đặt, `npm audit` của API không còn cảnh báo; app còn cảnh báo mức high
trong chuỗi công cụ Expo (`node-forge`, `zod`). npm đề xuất hạ Expo về SDK 44;
không áp dụng vì phá vỡ bộ SDK 58. Cần rà soát lại trước khi phát hành và trước
khi dùng ký OTA; chưa xác nhận an toàn phát hành chỉ bằng các kiểm tra local.

Tham khảo: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/),
[EAS Build](https://docs.expo.dev/build/setup/).
