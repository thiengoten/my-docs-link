-- Phase 4: CRM layer (customers + deals linking customers to projects).

create type deal_stage as enum
  ('lead', 'viewing', 'deposit', 'contract', 'closed', 'lost');

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Liên kết khách ↔ dự án, kèm giai đoạn. 1 khách có thể quan tâm nhiều dự án
-- và ngược lại; mỗi cặp là 1 deal duy nhất.
create table deals (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  project_id  uuid not null references projects(id)  on delete cascade,
  stage deal_stage not null default 'lead',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, project_id)
);

create index deals_customer_id_idx on deals(customer_id);
create index deals_project_id_idx  on deals(project_id);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger deals_set_updated_at
  before update on deals
  for each row execute function set_updated_at();

-- RLS: single-admin model, giống các bảng hiện có.
alter table customers enable row level security;
alter table deals enable row level security;

create policy "authenticated can manage customers"
  on customers for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can manage deals"
  on deals for all
  to authenticated
  using (true)
  with check (true);
