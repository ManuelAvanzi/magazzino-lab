begin;
create table public.warehouse_projects (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100),
 document jsonb not null check(octet_length(document::text)<=2097152),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.warehouse_projects enable row level security;
create index warehouse_owner_updated on public.warehouse_projects(owner_id,updated_at desc);
create policy "Read own warehouses" on public.warehouse_projects for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.warehouse_projects from anon, authenticated;
grant select on public.warehouse_projects to authenticated;
create function public.save_warehouse(project_id uuid,expected_revision integer,project_document jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare r integer; caller uuid:=auth.uid();
begin
 if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if project_document->>'version' is distinct from '1' or jsonb_typeof(project_document->'objects') is distinct from 'array'
 or jsonb_typeof(project_document->'width') is distinct from 'number' or jsonb_typeof(project_document->'depth') is distinct from 'number'
 or jsonb_typeof(project_document->'name') is distinct from 'string' then raise exception 'Invalid warehouse' using errcode='22023'; end if;
 if jsonb_array_length(project_document->'objects')>300 or (project_document->>'width')::numeric not between 16 and 60
 or (project_document->>'depth')::numeric not between 16 and 60 then raise exception 'Invalid warehouse' using errcode='22023'; end if;
 if expected_revision=0 then
  insert into public.warehouse_projects(id,owner_id,name,document) values(project_id,caller,project_document->>'name',project_document) returning revision into r;
 else
  update public.warehouse_projects set name=project_document->>'name',document=project_document,revision=revision+1,updated_at=now()
  where id=project_id and owner_id=caller and revision=expected_revision returning revision into r;
  if r is null then raise exception 'Project conflict or unavailable'; end if;
 end if;
 return r;
end;
$$;
revoke all on function public.save_warehouse(uuid,integer,jsonb) from public, anon;
grant execute on function public.save_warehouse(uuid,integer,jsonb) to authenticated;
commit;
