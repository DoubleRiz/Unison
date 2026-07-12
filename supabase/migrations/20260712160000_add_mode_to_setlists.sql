alter table public.setlists
  add column mode text not null default 'list' check (mode in ('list', 'document'));

update public.setlists set layout_document = null;
