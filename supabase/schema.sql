-- 우아재 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists books (
  id            bigint generated always as identity primary key,
  title         text not null,
  author        text,
  publisher     text,
  isbn          text,
  cover_image_url text,
  color         text,          -- fallback placeholder color while no real cover exists
  series        text,          -- optional — powers "같은 시리즈의 다른 책" on the detail screen
  tags          text[] not null default '{}',  -- genre/theme tags, e.g. {'그림책','우정'}
  created_at    timestamptz not null default now()
);

create table if not exists weekly_curations (
  id          uuid primary key default gen_random_uuid(),
  week_start  date not null,
  week_end    date not null,
  title       text,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists weekly_curation_books (
  curation_id uuid not null references weekly_curations(id) on delete cascade,
  book_id     bigint not null references books(id) on delete cascade,
  "order"     int not null default 0,
  primary key (curation_id, book_id)
);

create table if not exists reading_sessions (
  id           bigint generated always as identity primary key,
  book_id      bigint not null references books(id) on delete cascade,
  read_date    date not null default current_date,
  read_number  int not null,
  created_at   timestamptz not null default now()
);

create table if not exists records (
  id                bigint generated always as identity primary key,
  book_id           bigint not null references books(id) on delete cascade,
  reading_session_id bigint references reading_sessions(id) on delete set null,
  type              text not null check (type in
                      ('drawing','diary','summary','thought','learned','action','photo','quote','favorite_scene','parent_note')),
  content           text,
  image_url         text,
  created_at        timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------
-- Reads require a signed-in session — NEXT_PUBLIC_SUPABASE_ANON_KEY alone
-- is not enough, since it's visible in the browser bundle by design. Every
-- read now goes through `auth.role() = 'authenticated'`, so a leaked anon
-- key without a valid session gets nothing back.
--
-- Writes are NOT granted to anon or authenticated — the /api/books/*,
-- /api/records and /api/reading-sessions routes use the service_role key
-- (server-only, bypasses RLS) and each one independently checks for a
-- signed-in user (getRouteUser) before touching the database. RLS and the
-- route-level check are two separate layers on purpose.
--
-- This app models a single shared family library — anyone who can sign in
-- can see everything. If you need multiple separate families on one
-- deployment, add a `household_id` column + auth.uid()-based ownership
-- checks here instead of the blanket `authenticated` check.

alter table books enable row level security;
alter table weekly_curations enable row level security;
alter table weekly_curation_books enable row level security;
alter table reading_sessions enable row level security;
alter table records enable row level security;

create policy "authenticated read books" on books for select using (auth.role() = 'authenticated');
create policy "authenticated read weekly_curations" on weekly_curations for select using (auth.role() = 'authenticated');
create policy "authenticated read weekly_curation_books" on weekly_curation_books for select using (auth.role() = 'authenticated');
create policy "authenticated read reading_sessions" on reading_sessions for select using (auth.role() = 'authenticated');
create policy "authenticated read records" on records for select using (auth.role() = 'authenticated');
