# Sleep Gift API

NestJS + Neon Postgres, SQL viết tay. Phạm vi hiện tại: schema, migration, auth, `/me`, nhật ký giấc ngủ và lời chúc/khung cảnh/từ gốc (Task 1–5). Chưa deploy API.

Quyết định người dùng ngày 2026-10-27: **Phase 1 phát triển backend đã hoàn tất**; dời deploy đến sau phần phát triển/tích hợp chức năng, trước kiểm thử HTTPS và bàn giao. Nền tảng deploy API là **Railway**, database vẫn trên **Neon**. Các tham chiếu Vercel và Phase 1c/Task 6 trong spec/plan dùng chung là kế hoạch cũ; tài liệu dùng chung chưa sửa theo phạm vi phân công trong AGENTS.md.

Trong thời gian phát triển, mobile dùng API local qua IP LAN. Khi triển khai Railway, lấy URL HTTPS thực tế để cấu hình `EXPO_PUBLIC_API_URL`; bản release iOS cần URL HTTPS trước khi build/kiểm thử kết nối. Chưa tạo dịch vụ Railway hoặc thay đổi cấu hình runtime trong lần cập nhật này.

Đã cấu hình Neon project `sleep-gift-app` tại Singapore: branch `production` cho `.env`, branch `test` riêng cho `.env.test`. Ngày 2026-10-27: migration và chạy lại đều thành công trên cả hai branch. Chưa tạo tài khoản người dùng thật trên production. Logs/notes dùng schema có sẵn, không cần migration mới.

## Chạy local (Node 24)

```powershell
cd F:\Python\project\sleep-gift-app\api
npm ci
Copy-Item .env.example .env
# Điền DATABASE_URL của branch development và ADMIN_SECRET ngẫu nhiên >= 32 ký tự.
npm run migrate
npm run start:dev
```

`DATABASE_URL` và `ADMIN_SECRET` chỉ ở API; không đưa vào `EXPO_PUBLIC_*`. Tạo secret bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`, giữ riêng trên máy partner. API từ chối register khi secret rỗng hoặc sai.

Migration dùng kết nối trực tiếp Neon (host không có `-pooler`), chạy transaction và ghi tên vào `schema_migrations`; chạy lại không tạo lại bảng. Không chạy SQL schema bằng tay rồi chạy migration. API dùng `neon()` qua HTTP; migration dùng `Pool` qua WebSocket. Chạy lệnh trong `api/` để dotenv nạp đúng file.

## Hợp đồng cho mobile

| Endpoint | Body / quyền | Response thành công |
| --- | --- | --- |
| `POST /register` | `{name, adminSecret}`; public | 201 `{token, inviteCode}` |
| `POST /join` | `{code, name}`; public | 201 `{token, partnerName}` |
| `POST /invites` | Bearer partner | 201 `{inviteCode}` |
| `GET /me` | Bearer cả hai | 200 `{role, name, sharing_enabled, other}` |
| `PATCH /me` | `{name?, sharing_enabled?}`; Bearer | 200 cùng dạng `GET /me` |
| `PUT /logs/:date` | `LogDto`; Bearer sleeper | 200 `{applied: boolean}` |
| `GET /logs?from=&to=` | Bearer sleeper hoặc partner có quyền chia sẻ | 200 `Log[]` |
| `POST /notes` | `{kind, text, show_on_date?}`; Bearer partner | 201 `Note` |
| `GET /notes?from=&to=` | Bearer cả hai | 200 `Note[]` |
| `DELETE /notes/:id` | UUID; Bearer partner | 204 không body |

`other` là `{name, sharing_enabled}` hoặc `null` khi chưa ghép đôi. `name` dài 1–50 ký tự, `code` là **string** 6 chữ số (giữ số 0 đầu). Body có field lạ hoặc sai kiểu bị 400; PATCH không nhận null. Chỉ sleeper được đổi `sharing_enabled`.

Lỗi luôn `{error: string}`: 400 body sai / `invalid code`, 401 `unauthorized`, 403 `forbidden`, 409 `conflict`, 500 `internal`. Lỗi validation nối các thông báo bằng `; `.

Token ngẫu nhiên 32 byte, base64url dài 43 ký tự; database chỉ lưu SHA-256. App lưu token trong SecureStore và gửi `Authorization: Bearer <token>`. Register lại hoặc join bằng mã mới thay token cũ, giữ user ID, nhật ký và lựa chọn chia sẻ. Khi gặp 401 app về thiết lập và giữ dữ liệu cục bộ.

Mã mời hết hạn sau 7 ngày, dùng một lần. Mỗi join có DTO hợp lệ tăng attempts của **mọi** mã chưa dùng còn hạn trước khi so mã. Sau 5 lần đoán sai, các mã đó bị khóa; partner tạo mã mới. Hai join cùng mã chỉ một thành công. Giới hạn này cũng cho phép người lạ làm khóa mã đang chờ; tạo mã mới khi cần. Nếu đã nhận mã nhưng ghi user lỗi, mã bị tiêu thụ; không tự retry join, partner tạo mã mới.

Mobile cần nối register/join, lưu token, lấy `/me`, hỏi sleeper đồng ý chia sẻ và PATCH lựa chọn đó. Khi chạy trên điện thoại thật, API URL là IP Wi-Fi máy chạy API (cổng 3000), dùng HTTPS khi deploy.

### Nhật ký và đồng bộ

`:date`, `from`, `to` là ngày có thật dạng `YYYY-MM-DD`. Hai GET đều bắt buộc `from`/`to`, tính cả hai đầu, `from <= to`, tối đa 366 ngày lịch. Ngày sai, thiếu, query ngày lặp hoặc vượt khoảng → 400 `{error:"invalid date"}`.

```typescript
type LogDto = {
  bed_time: string;    // ISO 8601, app gửi kèm Z hoặc timezone offset
  wake_time: string;   // phải sau bed_time
  latency_min: number; // số nguyên 0–600
  awakenings: number;  // số nguyên 0–30
  awake_min: number;   // số nguyên 0–600
  rating: number;      // số nguyên 1–5
  note?: string;      // tối đa 500 ký tự
  updated_at: string; // ISO 8601, thời điểm sửa trên client
};
type Log = Omit<LogDto, 'note'> & { date: string; note: string | null };
type Note = {
  id: string;
  kind: 'goodnight' | 'scene' | 'word';
  text: string;                 // 1–2000 ký tự
  show_on_date: string | null;  // bắt buộc có ngày thật với goodnight
  created_at: string;
};
```

Log GET sắp theo ngày tăng dần; timestamps trả ISO UTC có `Z`. Chỉ bản có `updated_at` **mới hơn** bản trên server được ghi đè; bằng hoặc cũ hơn trả `{applied:false}`. Ghi đồng thời vẫn giữ bản có timestamp mới nhất. Không gửi `user_id`; API lấy từ Bearer token. Nếu bỏ `note` khi PUT, note được lưu thành null.

Partner đọc logs trước khi có sleeper → 404 `{error:"no sleeper yet"}`; khi sleeper tắt chia sẻ → 403 `{error:"sharing disabled"}`, kể cả khoảng không có log. API đọc quyền chia sẻ cùng câu SQL với nhật ký. Sleeper luôn đọc được nhật ký của mình. Partner ghi log hoặc sleeper viết/xóa note → 403 `{error:"forbidden"}`.

GET notes trả goodnight trong `[from,to]`; sleeper bị giới hạn thêm `show_on_date <= hôm nay Việt Nam + 7 ngày`, partner thấy đủ khoảng yêu cầu. Mọi scene/word đều được trả về dù có `show_on_date` ngoài khoảng. Xóa UUID không tồn tại → 404 `{error:"not found"}`, ID sai định dạng → 400. Không thêm endpoint sửa note trong phạm vi hiện tại.

Mobile cần:

- Đẩy log SQLite có `dirty=1` bằng PUT, giữ `updated_at` gốc khi retry. PUT 200 đã được server xử lý; `{applied:false}` nghĩa là có bản cùng thời điểm hoặc mới hơn, không lặp gửi vô hạn. GET lấy lại bản server khi cần đồng bộ.
- Kéo notes và **ghi đè** goodnight trong khoảng yêu cầu; ghi đè toàn bộ scene/word để note đã xóa biến mất trên máy. Sleeper nên lấy tới hôm nay +7 ngày.
- Với partner, phân biệt 403 chia sẻ tắt và 404 chưa ghép đôi; không hiển thị lại log đã cache như thể vẫn đang được chia sẻ sau khi API trả 403.
- DELETE 204 không parse JSON; cập nhật danh sách note sau khi xóa.

Trạng thái FE: [ ]

## Kiểm thử

```powershell
npm test -- --runInBand
npm run build
npx eslint "{src,test,scripts}/**/*.ts"
```

E2E chạy trên **branch test riêng**, reset `public` trước mỗi test; không dùng branch chứa dữ liệu cần giữ. Tạo `api/.env.test` (đã được gitignore):

```dotenv
DATABASE_URL=postgresql://...connection-to-dedicated-test-branch...
TEST_DATABASE_URL=postgresql://...same-dedicated-test-branch...
ADMIN_SECRET=local-test-only-secret
```

`TEST_DATABASE_URL` phải trùng `DATABASE_URL` để xác nhận đúng database trước reset. `.env.test` override env của shell cho tiến trình test; không lấy `.env` development để reset.

```powershell
npm run test:e2e
```

Kết quả 2026-10-27: 21/21 unit và 46/46 e2e trên branch Neon test đã qua. E2E kiểm tra ghi DB thật, mã mời hết hạn/khóa/dùng một lần/gửi song song, thu hồi token, giữ nhật ký khi join lại, quyền sửa/đọc chia sẻ, đồng bộ nhật ký cũ/mới/đồng thời, validation, giới hạn lời chúc theo ngày Việt Nam và xóa note. Chưa có kiểm chứng app trên điện thoại hoặc API production.
