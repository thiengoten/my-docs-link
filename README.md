# Project Knowledge Hub

Hệ thống quản lý tài liệu dự án BĐS trên nền Google Drive. Xem [`PRD.md`](./PRD.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`TASKS.md`](./TASKS.md) để biết chi tiết yêu cầu, kiến trúc và kế hoạch triển khai theo phase.

## Trạng thái hiện tại

- **Phase 0** (khởi tạo dự án): xong — Next.js 16 (App Router) + TypeScript + Tailwind, Supabase client (`lib/supabase/`), migration SQL.
- **Phase 1** (data model & CRUD dự án): xong — bảng `projects`/`documents`/`share_links`, RLS, trang `/dashboard/projects` với tạo/sửa/xóa dự án.
- **Phase 2** (tài liệu qua Google Drive): xong — OAuth kết nối Drive, Google Picker để chọn file, lưu metadata + trích xuất text PDF.
- **Phase 3** (tìm kiếm full-text): xong — RPC `search_documents`, trang `/dashboard/search` lọc theo dự án/loại/ngày.
- **Phase 4** (timeline pháp lý): xong — đánh dấu tài liệu pháp lý hết hiệu lực (`superseded`), liên kết tài liệu thay thế, trang `/dashboard/projects/[id]/legal-timeline`.
- **Phase 5** (chia sẻ read-only): xong — tạo/thu hồi link chia sẻ (`/dashboard/share-links`), trang public `/share/[token]` không cần đăng nhập.
- **Phase 6** (polish & deploy): phần polish trong code đã xong (responsive, empty/loading states, tự dọn token Google hỏng khi mất quyền truy cập). Việc deploy lên Vercel + Supabase production cần bạn tự thực hiện theo hướng dẫn ở mục [Deploy](#deploy) bên dưới (yêu cầu tài khoản/quyền truy cập ngoài phạm vi agent).

## Setup

### 1. Cài dependency

```bash
npm install
```

### 2. Tạo Supabase project

1. Vào [supabase.com](https://supabase.com) → tạo project mới.
2. Vào **Project Settings → API**, lấy `Project URL`, `anon public key`, `service_role key`.
3. Vào **SQL Editor**, chạy lần lượt 2 file migration theo thứ tự:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   (Hoặc dùng Supabase CLI: `supabase db push` nếu bạn đã link project.)
4. Vào **Authentication → Providers**, đảm bảo Email provider đang bật.
5. Vào **Authentication → Users**, tạo 1 user (chủ tài khoản) bằng email/password — đây là tài khoản quản trị duy nhất, không có trang đăng ký công khai trong app.

### 3. Tạo Google Cloud project (cho Phase 2 — Drive integration)

1. Vào [Google Cloud Console](https://console.cloud.google.com) → tạo project mới.
2. Vào **APIs & Services → Library**, bật:
   - Google Drive API
   - Google Picker API
3. Vào **APIs & Services → Credentials**:
   - Tạo **OAuth 2.0 Client ID** (loại Web application), thêm redirect URI `http://localhost:3000/api/google/oauth/callback` (và URL production sau này).
   - Tạo **API key** riêng cho Google Picker (giới hạn theo Picker API + domain của bạn).
4. Vào **OAuth consent screen**, thêm scope `https://www.googleapis.com/auth/drive.readonly` và `https://www.googleapis.com/auth/drive.file`. Vì app chỉ phục vụ 1 người dùng, có thể để ở chế độ Testing và thêm email của bạn vào danh sách test user (không cần app review).

### 4. Cấu hình biến môi trường

```bash
cp .env.local.example .env.local
```

Điền đầy đủ giá trị đã lấy ở bước 2 và 3 vào `.env.local`. `GOOGLE_TOKEN_ENCRYPTION_KEY` dùng để mã hóa refresh token của Google trước khi lưu vào Supabase — tự sinh bằng:

```bash
openssl rand -hex 32
```

### 5. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — sẽ redirect tới `/login`. Đăng nhập bằng tài khoản đã tạo ở bước 2.5.

## Cấu trúc thư mục

```
app/
  dashboard/          # các trang quản trị, yêu cầu đăng nhập (bảo vệ bởi proxy.ts)
    projects/         # CRUD dự án (Phase 1)
    search/           # tìm kiếm full-text (Phase 3)
    share-links/       # quản lý link chia sẻ (Phase 5)
  share/[token]/       # trang public read-only qua link chia sẻ (Phase 5)
  login/               # đăng nhập chủ tài khoản
lib/
  supabase/            # Supabase client (browser/server/service-role) + proxy session refresh
  actions/             # Server Actions (CRUD)
supabase/migrations/    # SQL migration, chạy thủ công hoặc qua Supabase CLI
types/database.ts       # types khớp với schema Postgres
proxy.ts                 # bảo vệ route /dashboard/** (Next.js "proxy", trước gọi là middleware)
```

## Deploy

### 1. Supabase production

Nếu bạn dùng project Supabase khác cho production (khuyến nghị tách biệt dev/prod), lặp lại bước **Setup → 2** ở project mới: chạy 2 file migration theo thứ tự, bật Email provider, tạo user quản trị.

### 2. Google Cloud — thêm redirect URI production

Vào lại **Credentials** của OAuth Client ID đã tạo ở bước Setup → 3, thêm redirect URI production, ví dụ:

```
https://<your-domain>.vercel.app/api/google/oauth/callback
```

Nếu Picker API key có giới hạn theo domain (HTTP referrer), thêm domain production vào danh sách được phép.

### 3. Deploy lên Vercel

1. Vào [vercel.com/new](https://vercel.com/new), import repo này.
2. Ở mục **Environment Variables**, khai báo đầy đủ các biến trong `.env.local.example`, dùng giá trị của Supabase/Google **production** (không dùng lại giá trị local):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_API_KEY`
   - `GOOGLE_REDIRECT_URI` = URL production ở bước 2 (phải khớp chính xác với URI đã khai báo trên Google Cloud)
   - `GOOGLE_TOKEN_ENCRYPTION_KEY` — nên sinh key **mới** cho production (`openssl rand -hex 32`), không tái sử dụng key local
3. Deploy. Sau khi có domain production, quay lại bước 2 nếu domain khác domain đã khai báo lúc đầu.
4. Mở domain production, đăng nhập bằng tài khoản quản trị đã tạo ở bước 1, vào một dự án bất kỳ → "Kết nối Google Drive" để xác minh OAuth flow hoạt động trên production.

### 4. Kiểm tra sau deploy

- Đăng nhập, tạo/sửa/xóa 1 dự án và 1 tài liệu thử để xác nhận Supabase production hoạt động.
- Tạo 1 link chia sẻ, mở bằng trình duyệt ẩn danh để xác nhận `/share/[token]` không yêu cầu đăng nhập.
- Kiểm tra trên điện thoại thật (không chỉ devtools responsive) — đặc biệt trang tìm kiếm và Google Picker, vì Picker mở popup riêng và có thể bị trình duyệt mobile chặn nếu không phải hành động trực tiếp từ tap của người dùng.
