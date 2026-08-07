create table if not exists career_results (
  id uuid primary key default gen_random_uuid(),
  nick text not null,
  role text not null,
  final_team text not null,
  final_league text not null,
  seasons_played int not null,
  score int not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists career_results_score_idx on career_results (score desc);
