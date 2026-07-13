-- Row Level Security: single-admin model.
-- Any authenticated user can manage projects/documents/share_links (v1 = single admin account, no public sign-up).
-- share_links are also readable anonymously by token via a SECURITY DEFINER function, never by direct table select.

alter table projects enable row level security;
alter table documents enable row level security;
alter table share_links enable row level security;
alter table google_auth_tokens enable row level security;

create policy "authenticated can manage projects"
  on projects for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can manage documents"
  on documents for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can manage share_links"
  on share_links for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can manage own google_auth_tokens"
  on google_auth_tokens for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read access for the /share/[token] page goes through this function
-- (SECURITY DEFINER) instead of a table policy, so anonymous users never get
-- direct SELECT access to documents/projects.
create or replace function get_share_link_by_token(p_token text)
returns table (
  id uuid,
  project_id uuid,
  document_ids uuid[],
  expires_at timestamptz,
  revoked boolean
)
language sql
security definer
set search_path = public
as $$
  select id, project_id, document_ids, expires_at, revoked
  from share_links
  where token = p_token
    and revoked = false
    and (expires_at is null or expires_at > now());
$$;

create or replace function get_shared_project(p_token text)
returns table (
  id uuid,
  name text,
  developer text,
  location text,
  status project_status
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.developer, p.location, p.status
  from projects p
  join share_links sl on sl.project_id = p.id
  where sl.token = p_token
    and sl.revoked = false
    and (sl.expires_at is null or sl.expires_at > now());
$$;

create or replace function get_shared_documents(p_token text)
returns table (
  id uuid,
  project_id uuid,
  drive_file_id text,
  drive_web_view_link text,
  file_name text,
  doc_type doc_type,
  status document_status,
  note text,
  document_date date
)
language sql
security definer
set search_path = public
as $$
  select d.id, d.project_id, d.drive_file_id, d.drive_web_view_link,
         d.file_name, d.doc_type, d.status, d.note, d.document_date
  from documents d
  join share_links sl on sl.project_id = d.project_id
  where sl.token = p_token
    and sl.revoked = false
    and (sl.expires_at is null or sl.expires_at > now())
    and (sl.document_ids is null or d.id = any(sl.document_ids));
$$;

grant execute on function get_share_link_by_token(text) to anon, authenticated;
grant execute on function get_shared_project(text) to anon, authenticated;
grant execute on function get_shared_documents(text) to anon, authenticated;
