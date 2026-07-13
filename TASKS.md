# TASKS.md — Break task cho Claude Code

> Đưa file này cùng `PRD.md` và `ARCHITECTURE.md` cho Claude Code. Làm theo thứ tự phase, mỗi phase nên là 1 lần trao đổi/1 nhánh git riêng để dễ review.

## Phase 0 — Khởi tạo dự án

- [ ] Khởi tạo Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- [ ] Khởi tạo project Supabase, lấy URL + anon key + service role key
- [ ] Tạo file `.env.local.example` liệt kê toàn bộ biến môi trường (xem `ARCHITECTURE.md` mục 7)
- [ ] Cấu hình Supabase client (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] Tạo Google Cloud project, bật Google Drive API + Google Picker API, tạo OAuth Client ID
- [ ] Setup Supabase Auth (email/password) cho 1 tài khoản chủ (chủ tài khoản tự đăng ký lần đầu, không mở đăng ký công khai)

## Phase 1 — Data model & CRUD Dự án

- [ ] Viết Supabase migration cho bảng `projects`, `documents`, `share_links` (schema trong `ARCHITECTURE.md` mục 3)
- [ ] Tạo Row Level Security (RLS) policy: chỉ chủ tài khoản (authenticated) mới CRUD được `projects`/`documents`/`share_links`
- [ ] Trang `/dashboard/projects`: danh sách dự án, mỗi thẻ hiển thị tên, chủ đầu tư, trạng thái, số lượng tài liệu theo loại
- [ ] Form tạo/sửa dự án (tên, chủ đầu tư, địa điểm, trạng thái, ghi chú)
- [ ] Chức năng xóa dự án (có confirm dialog, cảnh báo sẽ ảnh hưởng tài liệu liên quan)

**Acceptance**: Đăng nhập → tạo được dự án mới → sửa/xóa được → thấy trong danh sách.

## Phase 2 — Tích hợp Google Drive

- [ ] Luồng OAuth Google (đăng nhập Drive riêng biệt với đăng nhập app, lưu refresh token mã hóa)
- [ ] Tích hợp Google Picker API: modal chọn file từ Drive
- [ ] API route `POST /api/documents`: nhận `drive_file_id`, `project_id`, `doc_type` → lưu vào bảng `documents`
- [ ] Trang chi tiết dự án `/dashboard/projects/[id]`: danh sách tài liệu đã liên kết, nhóm theo loại
- [ ] Preview file: nhúng Google Drive preview iframe (`https://drive.google.com/file/d/{id}/preview`) khi click vào 1 tài liệu
- [ ] Cho phép sửa `doc_type`, `status`, `note`, `document_date` của từng tài liệu

**Acceptance**: Chọn file từ Drive picker → gắn vào 1 dự án + loại tài liệu → xuất hiện trong danh sách, click vào xem preview được.

## Phase 3 — Trích xuất nội dung & Tìm kiếm

- [ ] Background job (API route hoặc Supabase Edge Function) tải nội dung PDF từ Drive, dùng `pdf-parse` trích xuất text
- [ ] Lưu text đã trích xuất vào cột `extracted_text` (tsvector), tạo GIN index
- [ ] Trang `/dashboard/search`: ô tìm kiếm + bộ lọc (dự án, loại tài liệu, khoảng thời gian)
- [ ] API route `GET /api/search`: query Postgres full-text search kết hợp `file_name`/`note` ILIKE, trả kết quả kèm snippet
- [ ] Xử lý trường hợp tài liệu chưa có `extracted_text` (VD: ảnh) — vẫn search được theo tên file + ghi chú

**Acceptance**: Nhập từ khóa xuất hiện trong nội dung PDF → tìm ra đúng tài liệu; lọc theo dự án/loại/thời gian hoạt động đúng.

## Phase 4 — Timeline pháp lý

- [ ] Trang `/dashboard/projects/[id]/legal-timeline`
- [ ] UI hiển thị các tài liệu `doc_type = legal` theo thứ tự `document_date`, đánh dấu tài liệu `status = superseded` kèm link tới tài liệu thay thế
- [ ] Chức năng "Đánh dấu tài liệu này đã hết hiệu lực, thay thế bởi..." — cập nhật `status` + `superseded_by` khi upload tài liệu pháp lý mới

**Acceptance**: Xem được lịch sử pháp lý của 1 dự án theo thời gian, biết tài liệu nào còn hiệu lực.

## Phase 5 — Chia sẻ read-only

- [ ] API route tạo `share_links` (chọn dự án hoặc danh sách tài liệu cụ thể, có thể set `expires_at`)
- [ ] Trang public `/share/[token]` — không yêu cầu đăng nhập, chỉ hiển thị (không có action ghi), kiểm tra `revoked`/`expires_at`
- [ ] Trang quản lý link chia sẻ trong dashboard: xem danh sách link đã tạo, thu hồi (`revoked = true`) bất kỳ lúc nào

**Acceptance**: Tạo link → mở link ở trình duyệt ẩn danh (chưa đăng nhập) → xem được tài liệu, không có nút sửa/xóa; thu hồi link → link cũ báo lỗi/không truy cập được.

## Phase 6 — Polish & Deploy

- [ ] Responsive UI cho mobile (đặc biệt trang search và xem tài liệu)
- [ ] Empty states (chưa có dự án nào, chưa có tài liệu nào, tìm không ra kết quả)
- [ ] Loading states cho các thao tác gọi Drive API (có thể chậm)
- [ ] Xử lý lỗi Google Drive API (hết quota, mất quyền truy cập file, file bị xóa trên Drive)
- [ ] Deploy Next.js lên Vercel, kết nối Supabase production, cấu hình biến môi trường
- [ ] Viết `README.md` hướng dẫn setup Google Cloud OAuth + Supabase cho người triển khai sau này

**Acceptance**: App chạy ổn định trên production URL, dùng được trên điện thoại, không lỗi khi thao tác thông thường.

---

## Gợi ý khi làm việc với Claude Code

- Làm từng Phase một, review kỹ trước khi qua phase tiếp theo — đừng để Claude Code làm hết 6 phase trong 1 lần.
- Sau mỗi phase, tự tay test lại các "Acceptance" ở trên trước khi tiếp tục.
- Phase 2 (Google Drive OAuth) thường phức tạp nhất — nếu vướng, có thể yêu cầu Claude Code giải thích từng bước cấu hình Google Cloud Console trước khi code.
