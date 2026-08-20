-- Run once in the Supabase SQL editor if you already ran schema.sql before
-- tags/series were added to it. Safe to run even if the columns already
-- exist (IF NOT EXISTS).

alter table books add column if not exists series text;
alter table books add column if not exists tags text[] not null default '{}';

-- Speeds up "이 태그가 붙은 책" filtering as the library grows.
create index if not exists books_tags_idx on books using gin (tags);
