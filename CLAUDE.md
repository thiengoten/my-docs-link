@AGENTS.md

# Project Knowledge Hub

Ứng dụng quản lý tài liệu dự án bất động sản, xây trên Google Drive (Drive giữ file thật, app chỉ lưu metadata + text trích xuất để tìm kiếm). Người dùng là một chủ tài khoản duy nhất (single-admin), có thêm link chia sẻ public read-only cho khách hàng.

Tài liệu chi tiết, đọc trước khi làm việc lớn:
- [PRD.md](./PRD.md) — vấn đề, mục tiêu, user stories, requirements theo P0/P1/P2.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — tech stack, data model Postgres, luồng chính, bảo mật.
- [TASKS.md](./TASKS.md) — kế hoạch triển khai theo phase.
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — quy ước UI/component.
- [README.md](./README.md) — setup local, biến môi trường, hướng dẫn deploy.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4.
- Supabase (Postgres + Auth) — client trong `lib/supabase/` (`client.ts` browser, `server.ts` server components/actions, `middleware.ts` refresh session trong `proxy.ts`).
- Google Drive API + Google Picker cho lưu trữ file (`lib/google/`: `oauth.ts`, `drive.ts`, `crypto.ts` mã hóa refresh token).
- `pdf-parse` để trích xuất text PDF phục vụ full-text search (`lib/pdf.ts`, Postgres `tsvector`/`GIN index`).
- Mọi ghi dữ liệu đi qua Server Actions trong `lib/actions/` (không có route handler riêng cho CRUD).

## Cấu trúc thư mục

```
app/
  dashboard/            # route bảo vệ bởi proxy.ts (yêu cầu Supabase session)
    projects/           # CRUD dự án + trang chi tiết dự án
    search/              # tìm kiếm full-text
    share-links/         # quản lý link chia sẻ
    legal/                # tổng hợp pháp lý
    customers/, graph/    # đang phát triển (CRM: khách hàng/deal — chưa có trong ARCHITECTURE.md/PRD.md, xem lib/actions/customers.ts, lib/actions/deals.ts)
  share/[token]/         # trang public read-only, KHÔNG yêu cầu đăng nhập, chỉ đọc
  api/google/            # OAuth callback + refresh token cho Google Drive
  login/                  # đăng nhập chủ tài khoản
lib/
  supabase/               # Supabase client (browser/server) + session refresh
  google/                 # OAuth, Drive API, mã hóa token
  actions/                # Server Actions (CRUD) — nơi đặt logic ghi dữ liệu
supabase/migrations/       # SQL migration, đánh số thứ tự (chạy thủ công hoặc `supabase db push`)
types/database.ts          # type khớp schema Postgres, cập nhật cùng lúc với migration mới
proxy.ts                    # Next.js "proxy" (middleware cũ), bảo vệ /dashboard/**
```

## Quy ước quan trọng

- **Next.js 16 khác Next.js đời cũ đáng kể** — đọc `node_modules/next/dist/docs/` trước khi dùng API không chắc chắn (xem [AGENTS.md](./AGENTS.md)). Middleware truyền thống đã đổi tên/khái niệm thành "proxy" (`proxy.ts`).
- UI tiếng Việt, code (biến, hàm, comment) bằng tiếng Anh — giữ nhất quán với codebase hiện tại.
- Ghi dữ liệu qua Server Actions (`lib/actions/*.ts`), gọi `revalidatePath()` sau khi mutate để tránh cache cũ trên các route dashboard (xem `next.config.ts` — `staleTimes.dynamic = 30`).
- Route `/share/[token]` chỉ được đọc (không có action ghi nào) — không thêm mutation vào nhánh này.
- Google OAuth token luôn mã hóa trước khi lưu Supabase (`lib/google/crypto.ts`), không bao giờ expose ra client.
- Khi thêm bảng/cột mới: thêm migration SQL mới trong `supabase/migrations/` (đánh số tiếp theo) và cập nhật `types/database.ts` tương ứng.

## Lệnh hay dùng

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint (eslint-config-next core-web-vitals + typescript)
```

Không có test suite tự động trong repo hiện tại — kiểm tra thủ công qua `npm run dev` và (nếu chạm luồng UI) preview trình duyệt.
