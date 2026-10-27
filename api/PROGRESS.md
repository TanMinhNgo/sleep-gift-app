# Backend progress — 2026-10-27

- [x] Task 1: schema 4 bảng theo spec, migration có transaction + theo dõi phiên bản, token/date utils, validation và error filter.
- [x] Task 2: register / invites / join / Bearer guard; cấp lại token giữ user ID và dữ liệu; mã mời 7 ngày, một lần, khóa sau 5 lần sai.
- [x] Task 3: GET/PATCH me; chỉ sleeper sửa quyền chia sẻ; mặc định không chia sẻ.
- [x] 25 kiểm thử local (21 unit + 4 Swagger HTTP/schema); build NestJS; TypeScript và ESLint; 6 HTTP smoke checks local trả 401/400 đúng.
- [x] Neon project `sleep-gift-app` (`bold-cloud-48708238`, Singapore); `.env` có kết nối production, `.env.test` trỏ branch test riêng. Cả hai được gitignore.
- [x] Migration trên branch `test` và `production`, chạy lại lần hai đều thành công.
- [x] 46/46 e2e trên Neon thật: auth, quyền chia sẻ, token rotation, giữ nhật ký, mã mời hết hạn/khóa/dùng đồng thời; logs/notes và giới hạn ngày Việt Nam.
- [x] Task 4: PUT/GET logs; chặn partner khi chia sẻ tắt trong cùng snapshot SQL; bỏ qua updated_at cũ/bằng; ghi đồng thời giữ bản mới nhất; validate ngày và số liệu.
- [x] Task 5: GET/POST/DELETE notes; sleeper chỉ đọc goodnight tới ngày Việt Nam +7; scene/word đầy đủ; DELETE 204, ID sai 400, không tồn tại 404.
- [x] Hợp đồng logs/notes, lỗi, giới hạn và hành động mobile đã bổ sung vào `api/README.md`. Không cần migration mới.
- [x] Swagger `/docs`, OpenAPI `/docs-json` và `/docs-yaml`: đủ 10 thao tác, Bearer Authorize, request/response/validation/errors; đã kiểm tra HTTP UI/assets và schemas. Dependency audit sạch sau override có phạm vi cho js-yaml.
- [ ] Deploy Railway + smoke test production: dời đến sau phần phát triển/tích hợp chức năng, trước kiểm thử HTTPS và bàn giao; không còn là điều kiện hoàn thành Phase 1.

Hợp đồng và hướng dẫn tích hợp mobile nằm trong `api/README.md`. Không sửa app hoặc tài liệu dùng chung. Chưa commit.

Trạng thái FE: [ ]

Rà soát tích hợp qua mã nguồn mobile ngày 2026-10-27 (chỉ đọc, chưa kiểm thử trên máy thật): app đã gọi `/register`, `/join`, `/invites`, GET/PATCH `/me`; field và response tương ứng hợp đồng backend. Chưa có luồng gọi `/logs`, `/notes`; SQLite hiện chỉ có bảng settings. Phần tiếp theo ở mobile là Phase 3: nhật ký sáng, SQLite nhật ký/notes, đồng bộ dirty và lấy lời chúc, tính cửa sổ ngủ, nhắc tối và xả não. Backend hiện có đủ endpoint cho phạm vi này; không cần thêm endpoint. Chưa kết luận Phase 2 đã đạt kiểm thử hai máy/iPhone thật chỉ từ giao diện và mã nguồn.

Mốc bàn giao: Phase 1 phát triển backend (Task 1–5: database + auth + me + logs + notes) đã hoàn tất và được kiểm chứng trên Neon; mobile có thể tích hợp theo README. API chưa deploy. `ADMIN_SECRET` cần là secret ngẫu nhiên >= 32 ký tự trước khi deploy.

Quyết định người dùng ngày 2026-10-27: backend deploy lên **Railway**, giữ database trên Neon, dời deploy về sau. Quyết định này thay thế tham chiếu Vercel và Phase 1c/Task 6 trong tài liệu kế hoạch cũ. Chưa sửa spec/plan dùng chung theo phạm vi phân công trong AGENTS.md.
