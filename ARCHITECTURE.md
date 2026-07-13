# ARCHITECTURE.md — Project Knowledge Hub

## 1. Nguyên tắc thiết kế

- **Google Drive là nơi lưu file thật (source of truth cho binary file)**. App chỉ lưu **metadata** (tên, loại, ghi chú, trạng thái, link tới file Drive, nội dung text đã trích xuất để tìm kiếm).
- **Đơn giản trước, mở rộng sau**: bắt đầu với Postgres full-text search, không cần Elasticsearch/vector DB ở v1. Nếu số lượng tài liệu vượt vài chục nghìn, có thể nâng cấp sau (kiến trúc phía dưới đã tính đến việc này).
- **Một chủ tài khoản (single admin)**, nhưng có link chia sẻ public read-only riêng biệt — không dùng chung cơ chế auth.

## 2. Tech Stack đề xuất

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Frontend + Backend | Next.js 14+ (App Router) | Fullstack trong 1 repo, dễ deploy, API routes cho backend logic |
| Database | Supabase (Postgres) | Có sẵn Auth, Storage (nếu cần sau), Postgres full-text search built-in, free tier đủ dùng |
| Auth (chủ tài khoản) | Supabase Auth (email/password hoặc magic link) | Không cần tự xây hệ thống auth |
| Lưu trữ file | Google Drive API (OAuth2, scope readonly + file picker) | Theo yêu cầu: giữ Drive làm kho chứa |
| Trích xuất nội dung để search | `pdf-parse` (PDF), Google Drive `files.export`/OCR cho ảnh nếu cần (P1) | Lấy text để đánh index tìm kiếm |
| Tìm kiếm | Postgres `tsvector` + `GIN index` | Đủ nhanh cho quy mô hàng chục nghìn tài liệu; không cần hạ tầng search riêng ở v1 |
| Hosting | Vercel (Next.js) + Supabase Cloud | Free/thấp chi phí, phù hợp dự án cá nhân |

## 3. Data Model (Postgres)

```
projects
  id (uuid, pk)
  name (text)
  developer (text, nullable)
  location (text, nullable)
  status (enum: active, completed, on_hold)
  notes (text, nullable)
  created_at, updated_at

documents
  id (uuid, pk)
  project_id (fk -> projects.id)
  drive_file_id (text)          -- Google Drive file ID
  drive_web_view_link (text)    -- link mở file trong Drive
  file_name (text)
  doc_type (enum: legal, pricing, image, floor_plan, contract_template, other)
  status (enum: active, superseded, archived)
  note (text, nullable)         -- ghi chú ngắn của người dùng
  extracted_text (tsvector, nullable)  -- nội dung để full-text search
  superseded_by (uuid, nullable, fk -> documents.id) -- tài liệu nào thay thế tài liệu này
  document_date (date, nullable) -- ngày hiệu lực/ngày ban hành (khác created_at)
  created_at, updated_at

share_links
  id (uuid, pk)
  project_id (fk -> projects.id)
  token (text, unique)          -- phần random trong URL chia sẻ
  document_ids (uuid[], nullable) -- null = chia sẻ toàn bộ dự án, hoặc danh sách cụ thể
  expires_at (timestamp, nullable)
  revoked (boolean, default false)
  created_at
```

## 4. Luồng chính (Key Flows)

### 4.1 Liên kết tài liệu từ Drive
1. Chủ tài khoản đăng nhập Google OAuth (scope `drive.readonly` + `drive.file` cho picker).
2. Dùng Google Picker API để chọn 1 hoặc nhiều file từ Drive.
3. App lưu `drive_file_id`, `file_name`, `drive_web_view_link` vào bảng `documents`, gắn `project_id` + `doc_type` do người dùng chọn.
4. Background job gọi Drive API tải nội dung (nếu là PDF/Docs) → trích xuất text → lưu vào `extracted_text` (tsvector) để phục vụ search.

### 4.2 Tìm kiếm
1. Người dùng nhập từ khóa + bộ lọc (dự án, loại, thời gian).
2. Query Postgres: `WHERE extracted_text @@ plainto_tsquery('vietnamese', :query) OR file_name ILIKE ... OR note ILIKE ...`
3. Trả kết quả kèm điểm liên quan (`ts_rank`), sắp xếp theo độ liên quan hoặc ngày.

> Lưu ý: Postgres full-text search tiếng Việt cần cấu hình dictionary phù hợp (hoặc dùng `simple` config + chuẩn hóa bỏ dấu để tăng độ chính xác — cần quyết định kỹ thuật khi triển khai).

### 4.3 Timeline pháp lý
1. Trang `/projects/[id]/legal-timeline` lấy toàn bộ `documents WHERE project_id = :id AND doc_type = 'legal'`, sắp theo `document_date`.
2. Hiển thị dạng timeline, đánh dấu tài liệu nào có `status = superseded` và link tới `superseded_by`.

### 4.4 Chia sẻ read-only
1. Chủ tài khoản chọn "Tạo link chia sẻ" cho 1 dự án hoặc 1 tập tài liệu.
2. App tạo `share_links` với `token` random (VD: nanoid 21 ký tự).
3. URL public: `/share/[token]` — route này KHÔNG cần đăng nhập, chỉ query theo `token`, kiểm tra `revoked = false` và `expires_at` (nếu có), trả về danh sách tài liệu ở chế độ chỉ xem.
4. Route `/share/[token]` không có bất kỳ action ghi (POST/PUT/DELETE) nào — chỉ đọc.

## 5. Bảo mật

- Toàn bộ route quản trị (`/admin/**` hoặc `/dashboard/**`) yêu cầu Supabase session hợp lệ.
- Route `/share/[token]` là public nhưng chỉ expose dữ liệu đã được chủ tài khoản chọn công khai — không bao giờ trả về toàn bộ bảng `documents`.
- Google OAuth token (access + refresh) lưu mã hóa trong Supabase, không expose ra client.
- Google Drive files vẫn giữ nguyên quyền chia sẻ gốc trên Drive — app không thay đổi permission trên Drive.

## 6. Khả năng mở rộng (Scalability path)

Ở quy mô "nhiều dự án, nhiều tài liệu" hiện tại:
- Postgres full-text search xử lý tốt tới hàng trăm nghìn bản ghi nếu có GIN index đúng.
- Nếu sau này cần search ngữ nghĩa (semantic search, tìm theo ý chứ không chỉ từ khóa) → có thể thêm pgvector extension trên chính Supabase, không cần đổi hạ tầng.
- Nếu Drive API rate limit trở thành vấn đề (nhiều tài liệu đồng bộ cùng lúc) → thêm hàng đợi (queue) xử lý background thay vì gọi đồng bộ.

## 7. Biến môi trường cần thiết

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
NEXT_PUBLIC_GOOGLE_API_KEY=   # cho Google Picker
```
