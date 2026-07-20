-- Cho phép gắn link view 360 (Kuula) vào một dự án, hiển thị dạng iframe
-- trên trang chi tiết dự án.

alter table projects add column if not exists kuula_url text;
