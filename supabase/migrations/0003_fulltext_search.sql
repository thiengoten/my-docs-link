-- Phase 3: full-text search
-- Store the raw extracted text alongside the tsvector so we can generate
-- ts_headline snippets at query time; the tsvector stays in sync automatically.

drop index if exists documents_extracted_text_idx;
alter table documents drop column if exists extracted_text;

alter table documents add column extracted_text_raw text;
alter table documents add column extracted_text tsvector
  generated always as (to_tsvector('simple', coalesce(extracted_text_raw, ''))) stored;

create index documents_extracted_text_idx on documents using gin(extracted_text);

create or replace function search_documents(
  p_query text default null,
  p_project_id uuid default null,
  p_doc_type doc_type default null,
  p_date_from date default null,
  p_date_to date default null
)
returns table (
  id uuid,
  project_id uuid,
  project_name text,
  file_name text,
  doc_type doc_type,
  status document_status,
  note text,
  document_date date,
  snippet text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with query as (
    select case when p_query is null or trim(p_query) = ''
      then null
      else plainto_tsquery('simple', p_query)
    end as tsq
  )
  select
    d.id,
    d.project_id,
    p.name as project_name,
    d.file_name,
    d.doc_type,
    d.status,
    d.note,
    d.document_date,
    case
      when q.tsq is not null and d.extracted_text @@ q.tsq
        then ts_headline('simple', coalesce(d.extracted_text_raw, ''), q.tsq,
          'StartSel=§§, StopSel=§§, MaxWords=24, MinWords=8, MaxFragments=1')
      else coalesce(d.note, '')
    end as snippet,
    case
      when q.tsq is not null then ts_rank(d.extracted_text, q.tsq)
      else 0
    end as rank
  from documents d
  join projects p on p.id = d.project_id
  cross join query q
  where
    (
      q.tsq is null
      or d.extracted_text @@ q.tsq
      or d.file_name ilike '%' || p_query || '%'
      or d.note ilike '%' || p_query || '%'
    )
    and (p_project_id is null or d.project_id = p_project_id)
    and (p_doc_type is null or d.doc_type = p_doc_type)
    and (p_date_from is null or d.document_date >= p_date_from)
    and (p_date_to is null or d.document_date <= p_date_to)
  order by rank desc, d.document_date desc nulls last, d.created_at desc
  limit 50;
$$;

grant execute on function search_documents(text, uuid, doc_type, date, date) to authenticated;
