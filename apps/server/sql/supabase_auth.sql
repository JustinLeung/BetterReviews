-- supabase_auth.sql
-- Supabase-ONLY layer (it references the `auth` schema, so it only works on a
-- Supabase Postgres). Applied via `npm run supabase:auth` in the local Supabase
-- workflow — deliberately NOT part of the DB-agnostic core migration, so plain
-- Docker Postgres and Render are unaffected. Idempotent.

-- 1. Auto-create a public.users profile whenever a Supabase auth user is created
--    (e.g. the first magic-link sign-in). SECURITY DEFINER so it can write to
--    public.users regardless of the caller; search_path is pinned to '' per
--    Supabase guidance to avoid search_path hijacking. It is a trigger function
--    (not meant to be called directly) and only inserts the caller's own id.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
begin
  base_username := split_part(coalesce(new.email, 'user'), '@', 1);
  insert into public.users (id, display_name, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      base_username
    ),
    -- Keep username unique without a lookup by suffixing part of the uuid.
    base_username || '-' || substr(new.id::text, 1, 8),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Row Level Security.
--    The web client talks to our Express API, which uses a direct service-role
--    Postgres connection that BYPASSES RLS — it does NOT use the Supabase Data
--    API. Since `public` is an exposed schema, we lock the Data API down:
--    enable RLS with no permissive policies, so anon/authenticated cannot read
--    or write these tables directly over REST, while the server is unaffected.
--    Add policies here later if you decide to expose a table to the Data API.
do $$
declare t text;
begin
  foreach t in array array[
    'users','places','reason_tags','posts','photos',
    'post_reason_tags','follows','saves','schema_migrations'
  ] loop
    execute format('alter table if exists public.%I enable row level security;', t);
  end loop;
end $$;
