# PRD: Project Knowledge Hub — Hệ thống quản lý tài liệu dự án BĐS

## 1. Problem Statement

Người dùng (chuyên viên tư vấn BĐS/cho thuê) hiện lưu toàn bộ tài liệu dự án (thông tin dự án, hình ảnh, bảng giá, cập nhật pháp lý) trên Google Drive. Khi số lượng dự án tăng lên, việc tìm lại một tài liệu cụ thể (VD: "bảng giá launch mới nhất của S-Light Tower" hoặc "văn bản pháp lý mới nhất của dự án X") tốn rất nhiều thời gian vì Drive không có cấu trúc theo dự án, không phân loại tài liệu, và không có cách xem lịch sử thay đổi pháp lý theo thời gian. Hệ quả: mất thời gian tra cứu, dễ bỏ sót thông tin quan trọng khi tư vấn khách hàng.

## 2. Goals

1. Giảm thời gian tìm một tài liệu cụ thể xuống dưới 30 giây (so với việc phải lục Drive thủ công).
2. Có cái nhìn tổng quan theo từng dự án: tài liệu nào đang có, loại gì, còn hiệu lực hay không.
3. Theo dõi được lịch sử cập nhật pháp lý của từng dự án theo dòng thời gian (timeline), không chỉ file mới nhất.
4. Cho phép chia sẻ có kiểm soát (chỉ xem, không sửa) một phần thông tin dự án cho khách hàng khi cần.
5. Không phải di chuyển toàn bộ dữ liệu ra khỏi Google Drive — tận dụng hạ tầng lưu trữ đã có.

## 3. Non-Goals

- **Không thay thế Google Drive làm nơi lưu file thực tế** ở giai đoạn v1 — app chỉ là lớp quản lý/metadata/tìm kiếm nằm trên Drive, không tự lưu trữ file nhị phân (lý do: tận dụng hạ tầng sẵn có, giảm chi phí storage, tránh phải di chuyển dữ liệu cũ).
- **Không làm hệ thống quản lý khách hàng (CRM)** ở v1 — không quản lý lead, lịch hẹn, hợp đồng khách hàng (lý do: nằm ngoài phạm vi "quản lý tài liệu dự án", nên tách thành dự án riêng nếu cần sau).
- **Không hỗ trợ nhiều tổ chức/công ty (multi-tenant)** ở v1 — chỉ phục vụ một người dùng chính (chủ tài khoản) (lý do: chưa có nhu cầu, giữ đơn giản để triển khai nhanh).
- **Không có app di động riêng** ở v1 — chỉ web app responsive (lý do: ưu tiên tốc độ ra sản phẩm, web responsive đủ dùng trên điện thoại).
- **Không tự động giám sát/crawl các cổng thông tin pháp lý nhà nước** ở v1 — việc cập nhật pháp lý vẫn do người dùng upload thủ công (lý do: phức tạp, cần nguồn dữ liệu đáng tin cậy, để giai đoạn sau).

## 4. User Stories

**Là chủ tài khoản (người dùng chính)**
- Tôi muốn tạo một "Dự án" mới với tên, địa điểm, chủ đầu tư, trạng thái, để bắt đầu tổ chức tài liệu theo dự án.
- Tôi muốn upload hoặc liên kết tài liệu từ Google Drive vào một dự án, và gắn loại tài liệu (pháp lý / bảng giá / hình ảnh / mặt bằng / hợp đồng mẫu / khác), để phân loại rõ ràng.
- Tôi muốn khi upload một tài liệu pháp lý mới, có thể đánh dấu tài liệu pháp lý cũ liên quan là "đã hết hiệu lực", để không nhầm lẫn thông tin cũ/mới.
- Tôi muốn tìm kiếm theo từ khóa xuất hiện cả trong tên file lẫn nội dung file (kể cả PDF/ảnh scan), để không phải nhớ chính xác tên file.
- Tôi muốn lọc tài liệu theo dự án + loại tài liệu + khoảng thời gian, để thu hẹp kết quả nhanh.
- Tôi muốn xem một dòng thời gian (timeline) các cập nhật pháp lý của một dự án, để nắm được lịch sử thay đổi.
- Tôi muốn viết một ghi chú ngắn khi upload tài liệu (VD: "bảng giá áp dụng từ 01/07"), để tìm lại nhanh hơn là phải mở file.
- Tôi muốn tạo một link chia sẻ chỉ xem (read-only) cho một dự án hoặc một tập tài liệu, để gửi cho khách hàng mà không cấp quyền chỉnh sửa Drive.
- Tôi muốn đăng nhập đơn giản (không cần hệ thống tài khoản phức tạp) để bảo vệ dữ liệu của mình, vì tôi là người dùng duy nhất quản trị hệ thống.

**Là khách hàng nhận link chia sẻ**
- Tôi muốn xem được danh sách tài liệu công khai của một dự án qua link, mà không cần tạo tài khoản.
- Tôi muốn không thể chỉnh sửa, xóa, hay upload tài liệu qua link chia sẻ này.

## 5. Requirements

### Must-Have (P0)
- **Quản lý Dự án**: CRUD dự án (tên, chủ đầu tư, địa điểm, trạng thái, ghi chú).
  - *Acceptance*: Tạo/sửa/xóa dự án; danh sách dự án hiển thị số lượng tài liệu mỗi loại.
- **Liên kết Google Drive**: Đăng nhập Google OAuth của chủ tài khoản, chọn file/folder từ Drive để liên kết vào một dự án; xem trước (preview) file ngay trong app.
  - *Acceptance*: Chọn file từ Drive picker → gắn vào dự án + loại tài liệu → xuất hiện trong danh sách tài liệu của dự án.
- **Phân loại tài liệu**: Mỗi tài liệu có loại (pháp lý / bảng giá / hình ảnh / mặt bằng / hợp đồng mẫu / khác), trạng thái hiệu lực (còn hiệu lực / đã thay thế), ghi chú ngắn.
  - *Acceptance*: Đổi loại/trạng thái/ghi chú của tài liệu bất kỳ lúc nào; lịch sử thay đổi trạng thái được lưu lại.
- **Tìm kiếm & lọc**: Tìm theo tên file, ghi chú, và nội dung trích xuất (OCR/text extraction) của file; lọc theo dự án, loại, khoảng thời gian.
  - *Acceptance*: Nhập từ khóa → trả kết quả trong dưới 2 giây với vài trăm tài liệu; kết quả có thể lọc thêm theo dự án/loại/thời gian.
- **Timeline pháp lý**: Trang riêng cho mỗi dự án hiển thị các tài liệu loại "pháp lý" theo thứ tự thời gian.
  - *Acceptance*: Xem được tài liệu pháp lý nào thay thế tài liệu nào, theo mốc thời gian.
- **Đăng nhập đơn giản cho chủ tài khoản**: Một tài khoản quản trị, đăng nhập bằng email/mật khẩu hoặc magic link.
  - *Acceptance*: Chỉ chủ tài khoản mới vào được trang quản trị; phiên đăng nhập được lưu.
- **Link chia sẻ read-only**: Tạo link xem trước công khai (không cần đăng nhập) cho một dự án hoặc danh sách tài liệu chọn lọc.
  - *Acceptance*: Người có link xem được danh sách + preview file nhưng không có nút sửa/xóa/upload; có thể thu hồi link bất kỳ lúc nào.

### Nice-to-Have (P1)
- Đồng bộ tự động: khi có file mới trong folder Drive đã liên kết, tự động xuất hiện trong danh sách "chưa phân loại" để người dùng gắn nhãn.
- Gắn thẻ (tags) tự do ngoài loại tài liệu cố định (VD: "ưu tiên cao", "cần xác minh").
- Thông báo (email/trong app) khi một tài liệu pháp lý bị đánh dấu hết hiệu lực.
- Xem nhanh (quick view) ảnh dạng lưới (gallery) cho tài liệu loại hình ảnh.
- Export danh sách tài liệu của một dự án ra PDF/Excel để gửi nội bộ.

### Future Considerations (P2)
- Multi-user với phân quyền (đồng nghiệp cùng chỉnh sửa).
- Tự động crawl cổng thông tin pháp lý nhà nước để gợi ý cập nhật.
- Tích hợp AI tóm tắt nội dung tài liệu pháp lý dài.
- App di động riêng.

## 6. Success Metrics

**Leading indicators**
- Thời gian trung bình để tìm ra 1 tài liệu cụ thể (tự đo bằng cảm nhận sử dụng thực tế, mục tiêu dưới 30 giây).
- Số lượng dự án/tài liệu được đưa vào hệ thống trong tháng đầu (mục tiêu: toàn bộ dự án đang active).

**Lagging indicators**
- Tần suất còn phải mở Google Drive trực tiếp để tìm tài liệu (mục tiêu: giảm dần về gần 0 sau 1-2 tháng dùng).
- Số lần dùng link chia sẻ cho khách hàng thay vì gửi file thủ công.

## 7. Open Questions

- Giới hạn dung lượng/API quota của Google Drive API khi số lượng tài liệu tăng lớn — cần xác nhận khi triển khai kỹ thuật (engineering).
- Có cần OCR cho ảnh chụp văn bản pháp lý (không phải PDF text-based) ngay từ v1 hay để P1? (stakeholder — chính bạn quyết định dựa trên mức độ tài liệu là ảnh scan hay PDF gốc).
- Thời hạn lưu trữ cho các link chia sẻ (vĩnh viễn cho đến khi thu hồi, hay có ngày hết hạn mặc định)? (stakeholder)

## 8. Timeline Considerations

- Không có deadline cứng — đây là công cụ nội bộ.
- Đề xuất triển khai theo phase (xem file `TASKS.md`): Phase 1 (nền tảng + Drive integration) → Phase 2 (phân loại + tìm kiếm) → Phase 3 (timeline pháp lý + chia sẻ) → Phase 4 (polish/deploy).
