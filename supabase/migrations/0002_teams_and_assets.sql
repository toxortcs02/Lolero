create table if not exists teams (
  id text primary key,
  name text not null,
  tag text not null,
  primary_color text not null,
  secondary_color text not null,
  crest_url text,
  jersey_url text,
  updated_at timestamptz not null default now()
);

alter table teams enable row level security;

-- The game client reads teams directly with the anon key.
create policy "teams are publicly readable" on teams
  for select using (true);

-- No insert/update/delete policy for anon: all writes go through the
-- server-side admin API, which uses the service role key and bypasses RLS.

insert into storage.buckets (id, name, public)
values ('team-assets', 'team-assets', true)
on conflict (id) do nothing;

create policy "team assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'team-assets');
