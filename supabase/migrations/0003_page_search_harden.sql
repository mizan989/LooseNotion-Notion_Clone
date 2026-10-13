-- Keep the search functions from resolving objects through a caller-controlled
-- search_path. All application objects referenced by these functions are
-- schema-qualified in 0002_page_search.sql.
alter function public.extract_tiptap_text(jsonb)
  set search_path = '';

alter function public.update_block_search_text()
  set search_path = '';

alter function public.search_workspace_pages(uuid, text)
  set search_path = '';
