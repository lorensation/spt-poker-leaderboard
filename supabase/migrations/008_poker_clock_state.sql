create table if not exists public.poker_clock_state (
  id text primary key default 'default',
  levels jsonb not null,
  current_level_index integer not null default 0 check (current_level_index >= 0),
  status text not null default 'idle' check (status in ('idle', 'running', 'paused')),
  started_at timestamptz,
  paused_remaining_seconds integer check (paused_remaining_seconds is null or paused_remaining_seconds >= 0),
  entries integer not null default 0 check (entries >= 0),
  remaining_players integer not null default 0 check (remaining_players >= 0),
  buy_in_stack integer not null default 10000 check (buy_in_stack >= 0),
  entry_price numeric(10,2) not null default 10 check (entry_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists poker_clock_state_updated_at on public.poker_clock_state;

create trigger poker_clock_state_updated_at before update on public.poker_clock_state
for each row execute function public.set_updated_at();

alter table public.poker_clock_state enable row level security;

drop policy if exists "public read poker clock state" on public.poker_clock_state;
create policy "public read poker clock state"
on public.poker_clock_state
for select
to anon, authenticated
using (true);

grant select on public.poker_clock_state to anon, authenticated;

insert into public.poker_clock_state (
  id,
  levels,
  current_level_index,
  status,
  entries,
  remaining_players,
  buy_in_stack,
  entry_price
) values (
  'default',
  '[
    {"type":"blind","durationSeconds":1200,"smallBlind":100,"bigBlind":200,"ante":100},
    {"type":"blind","durationSeconds":1200,"smallBlind":200,"bigBlind":400,"ante":200},
    {"type":"blind","durationSeconds":1200,"smallBlind":300,"bigBlind":600,"ante":300},
    {"type":"break","durationSeconds":600,"label":"BREAK"},
    {"type":"blind","durationSeconds":1200,"smallBlind":500,"bigBlind":1000,"ante":500},
    {"type":"blind","durationSeconds":1200,"smallBlind":1000,"bigBlind":2000,"ante":1000}
  ]'::jsonb,
  0,
  'idle',
  0,
  0,
  10000,
  10
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'poker_clock_state'
  ) then
    alter publication supabase_realtime add table public.poker_clock_state;
  end if;
end $$;
