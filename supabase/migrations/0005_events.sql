create table if not exists events (
  id text primary key,
  category text not null,
  tier text not null default 'medium',
  title text not null,
  description text not null,
  role text,
  choices jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table events enable row level security;

-- The game client reads events directly with the anon key.
create policy "events are publicly readable" on events
  for select using (true);

-- No insert/update/delete policy for anon: all writes go through the
-- server-side admin API, which uses the service role key and bypasses RLS.
