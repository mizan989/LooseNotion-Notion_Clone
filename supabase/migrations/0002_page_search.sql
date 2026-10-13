-- Keep searchable text beside the document so searches do not fetch every full
-- TipTap document into the application server on each keystroke.
create or replace function public.extract_tiptap_text(doc jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(string_agg(value #>> '{}', ' '), '')
  from jsonb_path_query(doc, '$.**.text') as text_values(value);
$$;

alter table public.blocks
  add column if not exists search_text text not null default '';

create or replace function public.update_block_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := public.extract_tiptap_text(new.content);
  return new;
end;
$$;

drop trigger if exists blocks_search_text_trigger on public.blocks;
create trigger blocks_search_text_trigger
  before insert or update of content on public.blocks
  for each row execute function public.update_block_search_text();

update public.blocks set search_text = public.extract_tiptap_text(content)
where search_text = '';

create index if not exists blocks_search_text_idx
  on public.blocks using gin (to_tsvector('simple', search_text));
create index if not exists pages_title_search_idx
  on public.pages using gin (to_tsvector('simple', title));

create or replace function public.search_workspace_pages(p_workspace_id uuid, p_query text)
returns table(page_id uuid, title text, icon text, excerpt text, rank real)
language sql
stable
as $$
  with query_terms as (
    select plainto_tsquery('simple', trim(p_query)) as terms
  )
  select p.id,
         p.title,
         p.icon,
         left(coalesce(b.search_text, ''), 180),
         (case when to_tsvector('simple', p.title) @@ query_terms.terms then 2.0 else 0.0 end
           + ts_rank(to_tsvector('simple', coalesce(b.search_text, '')), query_terms.terms))::real
  from public.pages p
  left join public.blocks b on b.page_id = p.id
  cross join query_terms
  where p.workspace_id = p_workspace_id
    and not p.is_deleted
    and (to_tsvector('simple', p.title) @@ query_terms.terms
      or to_tsvector('simple', coalesce(b.search_text, '')) @@ query_terms.terms)
  order by 5 desc, p.title asc, p.id asc
  limit 20;
$$;

revoke all on function public.search_workspace_pages(uuid, text) from public, anon;
grant execute on function public.search_workspace_pages(uuid, text) to authenticated;
