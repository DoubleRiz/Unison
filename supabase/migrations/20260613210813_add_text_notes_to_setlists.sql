alter table public.setlists
  add column if not exists text_notes jsonb not null default '[]'::jsonb;
