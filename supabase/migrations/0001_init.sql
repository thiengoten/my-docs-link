-- Phase 1: core data model (projects, documents, share_links)

create type project_status as enum ('active', 'completed', 'on_hold');
create type doc_type as enum ('legal', 'pricing', 'image', 'floor_plan', 'contract_template', 'other');
create type document_status as enum ('active', 'superseded', 'archived');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  developer text,
  location text,
  status project_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  drive_file_id text not null,
  drive_web_view_link text,
  file_name text not null,
  doc_type doc_type not null,
  status document_status not null default 'active',
  note text,
  extracted_text tsvector,
  superseded_by uuid references documents(id) on delete set null,
  document_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  token text not null unique,
  document_ids uuid[],
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Google OAuth tokens for the single admin account (encrypted at rest by the app layer)
create table google_auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_project_id_idx on documents(project_id);
create index documents_doc_type_idx on documents(doc_type);
create index documents_extracted_text_idx on documents using gin(extracted_text);
create index share_links_token_idx on share_links(token);

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

create trigger documents_set_updated_at
  before update on documents
  for each row execute function set_updated_at();

create trigger google_auth_tokens_set_updated_at
  before update on google_auth_tokens
  for each row execute function set_updated_at();
