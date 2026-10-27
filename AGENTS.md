# Quy tắc làm việc

Repo có 2 AI agent làm song song. **Chỉ người dùng ra lệnh.** Hai agent không giao việc, không ra yêu cầu, không viết chỉ thị cho nhau.

| Agent | Phụ trách | Plan |
|---|---|---|
| Codex | Backend — `api/` | `docs/superpowers/plans/2026-10-25-api.md` |
| Claude Code | Mobile — `app/` | `docs/superpowers/plans/2026-10-25-app-foundation.md` |

- Chỉ sửa thư mục của mình. Cần thay đổi bên kia (hợp đồng API, file root, docs dùng chung) → báo người dùng, không tự sửa.
- Spec chung: `docs/superpowers/specs/2026-10-20-sleep-gift-app-design.md`. Hợp đồng API = spec mục 5 + khối **Interfaces** trong plan API; không tự đổi field/endpoint.
- Xong một mốc mà bên kia phụ thuộc (vd API chạy được, URL deploy) → báo người dùng; người dùng sẽ chuyển tiếp.
- Commit chỉ gồm file thuộc phần mình phụ trách.
