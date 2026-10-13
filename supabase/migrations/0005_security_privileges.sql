-- Keep SECURITY DEFINER RLS helpers outside PostgREST's exposed public schema.
-- RLS policies retain their function dependency when ALTER FUNCTION moves it.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

alter function public.is_workspace_member(uuid) set schema private;
alter function private.is_workspace_member(uuid) set search_path = '';
revoke all on function private.is_workspace_member(uuid) from public, anon, authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;

-- Anonymous clients have no application-data use case. RLS is defense in depth,
-- not a reason to grant anonymous table-level access.
revoke all privileges on all tables in schema public from anon;

-- Application users need ordinary row operations governed by RLS, but never
-- table-wide truncate, trigger, or references privileges.
revoke truncate, references, trigger on all tables in schema public from authenticated;

