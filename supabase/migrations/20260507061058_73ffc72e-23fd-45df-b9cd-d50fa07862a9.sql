create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  passage_id text not null,
  wpm integer not null,
  accuracy numeric(5,2) not null,
  duration integer not null,
  correct_chars integer not null default 0,
  created_at timestamptz not null default now()
);

create index sessions_user_idx on public.sessions(user_id, created_at desc);
create index sessions_wpm_idx on public.sessions(wpm desc);

alter table public.sessions enable row level security;

create policy "Sessions readable by authenticated"
  on public.sessions for select
  to authenticated
  using (true);

create policy "Users can insert own sessions"
  on public.sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.sessions for delete
  to authenticated
  using (auth.uid() = user_id);
