-- Bản đồ vùng đất cho từng dự án: vẽ polygon/ghim/chữ trên nền bản đồ vệ tinh,
-- lưu lại để chỉnh sửa tiếp và xuất ảnh PNG. Mỗi dự án có tối đa 1 bản vẽ.

create table project_maps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade unique,
  center_lat double precision not null default 21.0285,
  center_lng double precision not null default 105.8542,
  zoom smallint not null default 15,
  shapes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger project_maps_set_updated_at
  before update on project_maps
  for each row execute function set_updated_at();

alter table project_maps enable row level security;

create policy "authenticated can manage project_maps"
  on project_maps for all
  to authenticated
  using (true)
  with check (true);
