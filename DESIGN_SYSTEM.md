# DESIGN SYSTEM — Project Knowledge Hub

> Tài liệu bàn giao cho Claude Code. Đi kèm `PRD.md` và `ARCHITECTURE.md`. Stack: Next.js + Tailwind CSS. Mobile-first, dùng tốt trên web mobile (iOS Safari / Android Chrome) và mở rộng lên desktop.

---

## 0. Định hướng thiết kế

**Sản phẩm là gì, với ai:** một "sổ tài liệu số" cho một chuyên viên BĐS — công cụ tra cứu nhanh giữa lúc đang nói chuyện với khách hoặc đứng trước dự án. Người dùng thao tác bằng một tay, trên điện thoại, thường trong lúc di chuyển. Ưu tiên số 1 là **tốc độ đọc và tìm**, không phải trình diễn thị giác.

**Tính cách thương hiệu:** đáng tin cậy như một cuốn sổ địa chính, gọn và chính xác như một bộ hồ sơ pháp lý đã được đóng dấu — không phải một app "proptech" bóng bẩy, màu mè. Ẩn dụ thị giác xuyên suốt: **hồ sơ giấy đã được thẩm định và đóng dấu** — vì bản chất công việc là phân biệt tài liệu "đã xác thực, còn hiệu lực" với tài liệu "đã cũ, cần thay thế". Đây cũng là rủi ro/pain point lớn nhất của người dùng (nhầm bảng giá cũ, dùng văn bản pháp lý hết hiệu lực), nên hệ thống thị giác phải làm nổi bật bằng-mắt sự khác biệt đó trước khi người dùng phải đọc chữ.

**Rủi ro thẩm mỹ có chủ đích:** dùng đúng một "con dấu xác thực" (verification stamp) hình tròn làm chi tiết chữ ký thị giác của toàn app — xuất hiện duy nhất ở nơi có ý nghĩa (tài liệu pháp lý còn hiệu lực), không lạm dụng trang trí. Mọi thứ khác giữ kỷ luật, phẳng, ít màu.

---

## 1. Design Tokens

### 1.1 Màu sắc

Nền giấy có tông lạnh, ngả xám-xanh nhẹ (gợi giấy bản vẽ/giấy hồ sơ kỹ thuật) — **không dùng tông cream ấm kiểu template AI phổ biến**. Đỏ dấu (stamp red) là màu duy nhất mang tính "cảnh báo/xác thực", dùng rất tiết chế.

| Token | Hex | Vai trò |
|---|---|---|
| `--color-ink` | `#16233D` | Màu chữ chính, thương hiệu — xanh mực đậm |
| `--color-ink-soft` | `#3D4A63` | Chữ phụ, icon mặc định |
| `--color-slate` | `#6B7280` | Chữ mờ, placeholder, caption |
| `--color-paper` | `#EEF0EC` | Nền chính toàn app (giấy bản vẽ, lạnh nhẹ) |
| `--color-paper-raised` | `#FFFFFF` | Nền card, sheet, nổi trên `paper` |
| `--color-line` | `#DCDFD8` | Border, chia dòng |
| `--color-stamp` | `#B23A2E` | Đỏ dấu — CHỈ dùng cho: tài liệu pháp lý còn hiệu lực (con dấu), lỗi nghiêm trọng, hành động phá hủy |
| `--color-stamp-soft` | `#F3DEDB` | Nền nhạt của stamp (badge, banner) |
| `--color-jade` | `#3F7D5C` | Thành công, dự án đang hoạt động |
| `--color-jade-soft` | `#DCEBE2` | Nền nhạt của jade |
| `--color-amber` | `#B4791F` | Cảnh báo trung tính (VD: tài liệu chưa phân loại) |
| `--color-amber-soft` | `#F3E6D0` | Nền nhạt của amber |

**Nguyên tắc dùng màu:** `stamp` (đỏ) không bao giờ dùng cho nút hành động thông thường (đó là việc của `ink`) — chỉ dùng cho ý nghĩa "đã xác thực/pháp lý" hoặc "nguy hiểm/xóa". Nếu một màn hình có hơn một điểm nhấn đỏ không liên quan đến pháp lý, đó là lỗi thiết kế.

### 1.2 Typography

Ba vai trò chữ, không dùng chung một font cho tất cả — hồ sơ/mã tài liệu cần cảm giác "đánh máy sổ sách" khác với chữ giao diện thường:

| Vai trò | Font | Dùng cho |
|---|---|---|
| Display / UI | **Manrope** | Tiêu đề, tên nút, nhãn điều hướng — hình khối rõ, đọc nhanh ở cỡ nhỏ |
| Body | **IBM Plex Sans** | Nội dung, mô tả, ghi chú — hỗ trợ tiếng Việt có dấu tốt |
| Data / Mono | **IBM Plex Mono** | Tên file, mã hồ sơ, ngày tháng, số văn bản pháp lý — gợi cảm giác "sổ đăng ký" |

**Type scale (mobile-first, đơn vị rem, base 16px):**

| Token | Size / Line-height | Weight | Dùng cho |
|---|---|---|---|
| `text-display` | 28px / 34px | Manrope 700 | Tiêu đề trang (VD: tên dự án) |
| `text-title` | 20px / 26px | Manrope 700 | Tiêu đề section, tên card |
| `text-subtitle` | 16px / 22px | Manrope 600 | Tiêu đề phụ, tên tài liệu trong list |
| `text-body` | 15px / 22px | Plex Sans 400 | Nội dung chính |
| `text-body-strong` | 15px / 22px | Plex Sans 600 | Nhấn trong nội dung |
| `text-caption` | 13px / 18px | Plex Sans 400 | Ghi chú phụ, timestamp |
| `text-data` | 13px / 18px | Plex Mono 500 | Tên file, mã văn bản, ngày |
| `text-label` | 12px / 16px, uppercase, tracking 0.04em | Manrope 700 | Nhãn badge, eyebrow |

### 1.3 Spacing

Thang 4px, đặt tên theo bước — dùng nhất quán, không dùng giá trị tùy ý:

`space-1: 4px` · `space-2: 8px` · `space-3: 12px` · `space-4: 16px` · `space-5: 20px` · `space-6: 24px` · `space-8: 32px` · `space-10: 40px` · `space-12: 48px` · `space-16: 64px`

Quy ước: padding trong component dùng `space-3`/`space-4`; khoảng cách giữa các block dùng `space-6`/`space-8`; khoảng cách giữa các section lớn dùng `space-12`+.

### 1.4 Bo góc (Radius)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `radius-sm` | 6px | Badge, chip, input nhỏ |
| `radius-md` | 12px | Card, button, input |
| `radius-lg` | 20px | Bottom sheet, modal |
| `radius-full` | 999px | Avatar, con dấu, dot trạng thái |

### 1.5 Elevation (đổ bóng)

Bóng rất nhẹ — sản phẩm phẳng theo tinh thần "giấy tờ", không dùng bóng đậm kiểu Material mặc định:

| Token | Giá trị |
|---|---|
| `shadow-1` | `0 1px 2px rgba(22,35,61,0.06)` — card trên nền paper |
| `shadow-2` | `0 4px 12px rgba(22,35,61,0.10)` — sheet, dropdown |
| `shadow-3` | `0 12px 32px rgba(22,35,61,0.16)` — modal nổi trên overlay |

### 1.6 Motion

| Token | Giá trị | Dùng cho |
|---|---|---|
| `duration-fast` | 120ms | Nhấn nút, toggle |
| `duration-base` | 200ms | Mở/đóng sheet, chip filter |
| `duration-slow` | 320ms | Chuyển trang, con dấu "đóng dấu" |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Mặc định |
| `ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Khoảnh khắc nhấn mạnh (con dấu xuất hiện) |

Tôn trọng `prefers-reduced-motion` — tắt animation "đóng dấu" và chuyển trang trượt, giữ lại thay đổi trạng thái tức thời.

---

## 2. Layout & Grid (mobile-first)

| Breakpoint | Độ rộng | Layout |
|---|---|---|
| Base (mobile) | < 640px | 1 cột, bottom navigation, full-width card, padding ngang `space-4` |
| `sm` | ≥ 640px | 1 cột rộng hơn, padding ngang `space-6` |
| `md` | ≥ 768px | 2 cột cho danh sách dự án (grid card), sheet → modal căn giữa |
| `lg` | ≥ 1024px | Sidebar cố định bên trái thay bottom nav, nội dung 2-3 cột |

Thiết kế **mobile trước**: mọi component viết mặc định cho mobile, dùng Tailwind `md:`/`lg:` để mở rộng lên desktop — không làm ngược lại.

**Vùng chạm (touch target):** tối thiểu 44×44pt (iOS) / 48×48dp (Android) → quy ra web: tối thiểu `44px` chiều cao cho mọi phần tử bấm được, kể cả khi icon bên trong nhỏ hơn (dùng padding để đạt đủ vùng chạm).

**Safe area:** dùng `env(safe-area-inset-bottom)` cho bottom navigation và nút hành động nổi (FAB) để không bị che bởi thanh home-indicator của iOS.

---

## 3. Iconography

- Bộ icon: **Lucide** (outline, stroke 1.5-2px, bo góc nhẹ) — nhất quán, có sẵn cho React.
- Kích thước chuẩn: 20px (trong text/list), 24px (nút độc lập, nav).
- Không trộn icon filled và outline trong cùng một màn hình, trừ trạng thái active của bottom navigation (active = filled, inactive = outline) — đây là quy ước duy nhất được phép trộn.

---

## 4. Chi tiết chữ ký của hệ thống: "Con dấu xác thực"

Đây là **chi tiết thị giác riêng biệt duy nhất** của app, dùng đúng một chỗ có ý nghĩa: đánh dấu tài liệu pháp lý **còn hiệu lực**.

- Hình: vòng tròn viền đứt nét (dashed), màu `--color-stamp`, đường kính 20px, có icon check nhỏ ở giữa.
- Vị trí: góc trên-phải của Document Card, chỉ xuất hiện khi `doc_type = legal` VÀ `status = active`.
- Animation khi một tài liệu pháp lý mới được xác nhận "còn hiệu lực": con dấu xoay nhẹ 8deg rồi về 0deg trong `duration-slow`, kèm hiệu ứng scale 0.8→1 — mô phỏng động tác "đóng dấu". Chỉ chạy một lần khi trạng thái chuyển sang active, không lặp lại mỗi lần render.
- Khi tài liệu pháp lý bị đánh dấu `superseded` (hết hiệu lực): con dấu biến mất, thay bằng nhãn chữ xám "Đã thay thế" kèm link tới tài liệu mới — **không** dùng dấu gạch chéo đỏ đè lên (tránh cảm giác lỗi/cấm, đây chỉ là thông tin trạng thái).

Không dùng motif con dấu ở bất kỳ nơi nào khác (không làm logo, không làm loading spinner) — giữ nó hiếm để còn ý nghĩa.

---

## 5. Components

### 5.1 Button

| Thuộc tính | Giá trị |
|---|---|
| Variants | `primary` (nền `ink`, chữ trắng) · `secondary` (viền `line`, nền `paper-raised`) · `ghost` (không nền/viền, chữ `ink`) · `destructive` (nền `stamp`, chữ trắng — chỉ cho hành động xóa vĩnh viễn) |
| Sizes | `md` (44px cao, mặc định mobile) · `sm` (36px, dùng trong toolbar/inline) |
| States | default · pressed (giảm opacity 0.85 + scale 0.98, `duration-fast`) · disabled (opacity 0.4, không tương tác) · loading (spinner thay icon, giữ nguyên label) |
| Radius | `radius-md` |
| Accessibility | Role `button`; focus ring 2px `ink` offset 2px; label rõ hành động ("Lưu tài liệu" chứ không phải "OK") |

**Do/Don't:** ✅ Một `primary` button trên mỗi màn hình. ❌ Không đặt 2 `primary` cạnh nhau — chọn 1 hành động chính, còn lại là `secondary`/`ghost`.

### 5.2 Input & Search Bar

- Chiều cao 44px, `radius-md`, nền `paper-raised`, viền `line` 1px, focus → viền `ink` 1.5px + không dùng box-shadow glow (giữ phẳng).
- Search bar (thanh tìm kiếm chính): icon kính lúp bên trái, nút xóa (x) xuất hiện bên phải khi có nội dung, luôn cố định (sticky) ở đầu trang danh sách khi cuộn trên mobile.
- Placeholder dùng `text-body` màu `slate`, không in nghiêng.
- Error state: viền `stamp`, dòng lỗi `text-caption` màu `stamp` ngay dưới input, kèm icon cảnh báo nhỏ.

### 5.3 Document Type Badge

Badge nhỏ, bo `radius-sm`, nền `*-soft`, chữ `text-label`:

| Loại tài liệu | Màu nền | Màu chữ |
|---|---|---|
| Pháp lý | `stamp-soft` | `stamp` |
| Bảng giá | `amber-soft` | `amber` |
| Hình ảnh | `--color-line` (xám) | `ink-soft` |
| Mặt bằng | `--color-line` (xám) | `ink-soft` |
| Hợp đồng mẫu | `jade-soft` | `jade` |
| Khác | `--color-line` (xám) | `slate` |

### 5.4 Status Badge (trạng thái hiệu lực)

- `active` (còn hiệu lực): dot tròn `jade` 6px + chữ "Còn hiệu lực" — riêng tài liệu pháp lý dùng Con dấu xác thực (mục 4) thay vì badge này.
- `superseded` (đã thay thế): dot tròn `slate` + chữ "Đã thay thế", chữ có gạch ngang nhẹ (`text-decoration: line-through` màu `slate`, không dùng cho tên file — chỉ cho badge).
- `archived`: dot tròn viền `line`, chữ `slate`.

### 5.5 Document Card

Layout dọc, mobile full-width, `radius-md`, `shadow-1`, nền `paper-raised`, padding `space-4`:

```
┌─────────────────────────────────┐
│ [Icon loại file]      [Con dấu*]│
│ Tên tài liệu (text-subtitle)     │
│ [Badge loại] [Badge trạng thái]  │
│ Ghi chú ngắn (text-body, 1 dòng, │
│  cắt bằng ellipsis)              │
│ 12/06/2026 · legal-2026-08.pdf   │  ← text-data, màu slate
└─────────────────────────────────┘
```
*Con dấu chỉ hiện khi loại = pháp lý + còn hiệu lực (mục 4).

- Toàn bộ card là vùng bấm được (mở preview), tối thiểu cao 44px vùng chạm dù nội dung ngắn hơn.
- Long-press (mobile) hoặc icon "..." (desktop) mở action sheet: Đổi loại / Đổi trạng thái / Sửa ghi chú / Xóa liên kết.

### 5.6 Project Card

Grid 1 cột (mobile) / 2 cột (`md`+), `radius-md`, `shadow-1`:

- Tên dự án (`text-title`) + chủ đầu tư (`text-caption`, màu `slate`).
- Dòng đếm nhanh theo loại: "12 pháp lý · 8 bảng giá · 34 hình ảnh" (`text-data`) — giúp quét bằng mắt không cần mở vào.
- Chip trạng thái dự án góc trên-phải: Đang hoạt động (`jade`) / Tạm dừng (`amber`) / Hoàn thành (`slate`).

### 5.7 Filter Chip

- Dạng viên thuốc (`radius-full`), viền `line`, nền `paper-raised`; khi chọn: nền `ink`, chữ trắng.
- Nhóm chip cuộn ngang (horizontal scroll) trên mobile, không wrap xuống dòng, để giữ chiều cao thanh filter cố định.
- Luôn có chip "Xóa lọc" xuất hiện cuối cùng khi có ≥1 filter đang chọn.

### 5.8 Điều hướng

**Mobile (< 1024px) — Bottom Tab Bar cố định:**
`Dự án` · `Tìm kiếm` · `Pháp lý` (biểu tượng con dấu outline) · `Chia sẻ`
- Cao 56px + safe-area-inset-bottom, nền `paper-raised`, viền trên `line` 1px.
- Icon 24px, active = filled + màu `ink`, inactive = outline + màu `slate`.
- Không dùng label text ẩn — luôn hiện label `text-label` dưới icon (ưu tiên rõ ràng hơn tối giản, vì đây là công cụ làm việc không phải app tiêu dùng).

**Desktop (≥ 1024px) — Sidebar trái cố định**, cùng 4 mục trên theo chiều dọc, rộng 240px.

### 5.9 Bottom Sheet / Modal

- Mobile: mọi form (tạo dự án, gắn loại tài liệu, tạo link chia sẻ) mở dưới dạng **bottom sheet** trượt lên (`radius-lg` ở 2 góc trên, `shadow-3`), có kéo xuống để đóng (drag handle 32px ở giữa đỉnh sheet).
- Desktop (`md`+): cùng nội dung hiển thị dạng modal căn giữa, `radius-lg` cả 4 góc, tối đa rộng 480px.
- Overlay nền `rgba(22,35,61,0.4)`, tap ngoài để đóng (trừ form đang nhập dở → cần confirm trước khi đóng).

### 5.10 Legal Timeline (component riêng cho Phase 4 của TASKS.md)

- Đường thẳng đứng bên trái (2px, màu `line`), mỗi tài liệu pháp lý là một điểm mốc (dot 10px) nối vào đường này.
- Mốc đang `active`: dot màu `stamp`, kèm Con dấu xác thực bên cạnh tên tài liệu.
- Mốc `superseded`: dot màu `slate` rỗng (viền, không tô), có đường nối mảnh (arrow) trỏ sang mốc đã thay thế nó nếu nằm gần nhau trên timeline.
- Mỗi mốc hiện: ngày hiệu lực (`text-data`), tên văn bản (`text-subtitle`), ghi chú (`text-caption`).
- Thứ tự: mới nhất ở trên cùng (giống feed), vì người dùng cần biết "hiện tại đang hiệu lực là gì" trước tiên.

### 5.11 Toast / Snackbar

- Xuất hiện đáy màn hình, phía trên bottom nav, `radius-md`, nền `ink`, chữ trắng, tự ẩn sau 3s hoặc có nút "Hoàn tác" cho hành động xóa.
- Không dùng cho lỗi nghiêm trọng (dùng inline error thay vì toast biến mất quá nhanh khi cần người dùng phải xử lý).

### 5.12 Empty State

Mỗi màn hình rỗng có: icon outline lớn (48px, màu `line`), 1 dòng tiêu đề (`text-subtitle`) mô tả đúng tình huống, 1 dòng phụ gợi ý hành động, và nút hành động chính nếu phù hợp.

Ví dụ nội dung (xem thêm mục 8 về giọng văn):
- Chưa có dự án: "Chưa có dự án nào" / "Tạo dự án đầu tiên để bắt đầu sắp xếp tài liệu." / [Tạo dự án]
- Tìm không ra kết quả: "Không tìm thấy tài liệu phù hợp" / "Thử từ khóa khác hoặc bỏ bớt bộ lọc."

---

## 6. Khác biệt nền tảng iOS vs Android (web mobile)

App là web responsive, nhưng vẫn tôn trọng cảm giác quen thuộc của từng nền tảng ở các điểm chi phí thấp, lợi ích cao:

| Yếu tố | iOS (Safari) | Android (Chrome) |
|---|---|---|
| Vuốt lùi (back gesture) | Không chặn vuốt cạnh trái để back — tránh đặt carousel/slider chiếm toàn bộ cạnh trái màn hình | Không cần xử lý riêng, nhưng đảm bảo nút back trình duyệt luôn hoạt động đúng (không phá lịch sử điều hướng bằng SPA routing sai cách) |
| Font rendering | Test kỹ Manrope/Plex trên Safari — hinting khác Chrome, kiểm tra độ đậm ở `text-label` (uppercase nhỏ dễ bị rối) | Mặc định mượt hơn, không cần chỉnh riêng |
| Input focus | Bàn phím đẩy layout — dùng `100dvh` thay vì `100vh` để tránh input bị che khi bàn phím bật | Tương tự, `100dvh` cũng xử lý tốt |
| Haptic feedback | Không có API haptic chuẩn trên web iOS — bỏ qua, dùng animation thị giác thay thế (scale khi nhấn) | Có thể dùng `navigator.vibrate()` nhẹ (10-15ms) cho hành động xác nhận quan trọng (đóng dấu xác thực) — progressive enhancement, không bắt buộc |
| Safe area | Bắt buộc dùng `env(safe-area-inset-*)` cho bottom nav (home indicator) | Không cần safe-area-bottom, nhưng vẫn nên giữ padding tương đương để đồng nhất |

---

## 7. Accessibility

- Tỉ lệ tương phản tối thiểu 4.5:1 cho text thường, 3:1 cho text lớn (`text-title` trở lên) — đã kiểm tra `ink` (#16233D) trên `paper` (#EEF0EC) đạt ~12:1, an toàn.
- Mọi vùng chạm ≥ 44px (mục 2).
- Focus visible bắt buộc cho điều hướng bàn phím (desktop/trackpad): outline 2px `ink`, offset 2px, không bao giờ `outline: none` mà không có thay thế.
- Con dấu xác thực (mục 4) không được là **cách duy nhất** truyền đạt "còn hiệu lực" — luôn đi kèm text "Còn hiệu lực" cho screen reader (`aria-label`), không chỉ dựa vào hình dạng/màu.
- `prefers-reduced-motion`: tắt animation đóng dấu, chuyển trang trượt; giữ transition đổi màu tức thời.

---

## 8. Nội dung & giọng văn

- Xưng hô: gọi hành động bằng động từ chủ động, đúng việc người dùng làm — "Lưu ghi chú", không phải "Xác nhận" chung chung.
- Tên hành động nhất quán xuyên suốt luồng: nút "Tạo link chia sẻ" → toast phải nói "Đã tạo link chia sẻ" (không đổi thành "Link đã sẵn sàng").
- Trạng thái lỗi nói đúng chuyện gì xảy ra và cách sửa, không xin lỗi: "Không thể tải nội dung từ Google Drive. Kiểm tra lại quyền truy cập file." — không phải "Rất tiếc, đã có lỗi xảy ra."
- Empty state là lời mời hành động, không phải thông báo trống rỗng (xem ví dụ mục 5.12).
- Toàn bộ UI tiếng Việt không dấu-lỗi-chính-tả — vì đây là công cụ nghề nghiệp, sai chính tả làm giảm cảm giác đáng tin cậy đúng với tinh thần "hồ sơ pháp lý" mà hệ thống hướng tới.

---

## 9. Handoff kỹ thuật cho Claude Code

### 9.1 Tailwind config (`tailwind.config.ts`)

```ts
export default {
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#16233D', soft: '#3D4A63' },
        slate: '#6B7280',
        paper: { DEFAULT: '#EEF0EC', raised: '#FFFFFF' },
        line: '#DCDFD8',
        stamp: { DEFAULT: '#B23A2E', soft: '#F3DEDB' },
        jade: { DEFAULT: '#3F7D5C', soft: '#DCEBE2' },
        amber: { DEFAULT: '#B4791F', soft: '#F3E6D0' },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        data: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px', md: '12px', lg: '20px',
      },
      boxShadow: {
        1: '0 1px 2px rgba(22,35,61,0.06)',
        2: '0 4px 12px rgba(22,35,61,0.10)',
        3: '0 12px 32px rgba(22,35,61,0.16)',
      },
      transitionDuration: {
        fast: '120ms', base: '200ms', slow: '320ms',
      },
    },
  },
}
```

### 9.2 CSS variables (`globals.css`) — dùng nếu cần truy cập token ngoài Tailwind (canvas, inline style cho animation con dấu)

```css
:root {
  --color-ink: #16233D;
  --color-ink-soft: #3D4A63;
  --color-slate: #6B7280;
  --color-paper: #EEF0EC;
  --color-paper-raised: #FFFFFF;
  --color-line: #DCDFD8;
  --color-stamp: #B23A2E;
  --color-stamp-soft: #F3DEDB;
  --color-jade: #3F7D5C;
  --color-jade-soft: #DCEBE2;
  --color-amber: #B4791F;
  --color-amber-soft: #F3E6D0;
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
}
```

### 9.3 Thứ tự triển khai đề xuất (khớp với `TASKS.md`)

1. Setup token trước (Tailwind config + font import Google Fonts: Manrope, IBM Plex Sans, IBM Plex Mono) — làm ngay trong Phase 0.
2. Build component nền tảng trước khi build màn hình: Button, Badge, Card, Input — dùng chung cho mọi Phase.
3. Component "Con dấu xác thực" build riêng, có Storybook-style demo page tạm (`/dev/stamp-demo`) để duyệt animation trước khi gắn vào Document Card thật — tránh phải chỉnh animation sau khi đã tích hợp sâu.
4. Bottom navigation + layout shell build cùng lúc với Phase 1 (CRUD Dự án) vì mọi trang sau đều phụ thuộc vào layout này.

### 9.4 Việc KHÔNG nên làm

- Không hardcode hex trực tiếp trong component — luôn qua token Tailwind (`bg-ink`, `text-stamp`...).
- Không tạo thêm màu ngoài bảng ở mục 1.1 khi cần "thêm màu cho đẹp" — nếu thấy thiếu, quay lại xem lại nghĩa ngữ nghĩa (semantic) trước, khả năng cao một token hiện có (`amber`/`jade`) đã đủ dùng.
- Không dùng box-shadow đậm hoặc gradient trang trí — phá vỡ tinh thần "phẳng như giấy tờ" của hệ thống.
