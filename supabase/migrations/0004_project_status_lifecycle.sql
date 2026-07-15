-- Expand project_status to cover the full project lifecycle.
-- Existing values (active, completed, on_hold) are kept as-is so current
-- data needs no backfill; 'active' is now surfaced in the UI as "Đang mở bán".

alter type project_status add value if not exists 'planning' before 'active';
alter type project_status add value if not exists 'construction' before 'active';
alter type project_status add value if not exists 'handover' after 'active';
