-- Auth profile creation is intended to run only from its database trigger,
-- never as a client-callable PostgREST RPC.
alter function public.handle_new_user()
  set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- This helper is used by RLS policies. Keep SECURITY DEFINER for the membership
-- lookup, but resolve auth.uid() only from the fixed auth schema. The table is
-- already schema-qualified in the function body.
alter function public.is_workspace_member(uuid)
  set search_path = auth;
