create extension if not exists pgcrypto;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  nickname text unique not null check (length(trim(nickname)) between 2 and 32),
  avatar_url text,
  edit_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  played_at date not null,
  status text not null default 'draft'
    check (status in ('draft', 'voting_open', 'voting_closed', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  finish_position integer not null check (finish_position between 1 and 99),
  money_earned numeric(10,2) not null default 0,
  buyins integer not null default 1 check (buyins >= 0),
  rebuys integer not null default 0 check (rebuys >= 0),
  addon boolean not null default false,
  finishing_points integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, player_id),
  unique (game_id, finish_position)
);

create table public.game_votes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  voter_player_id uuid not null references public.players(id) on delete cascade,
  voted_player_id uuid not null references public.players(id) on delete cascade,
  vote_rank integer not null check (vote_rank in (1,2,3)),
  points_awarded integer not null check (points_awarded in (1,2,3)),
  created_at timestamptz not null default now(),
  check (voter_player_id <> voted_player_id),
  unique (game_id, voter_player_id, vote_rank),
  unique (game_id, voter_player_id, voted_player_id)
);

create index idx_games_played_at on public.games(played_at desc);
create index idx_results_player on public.game_results(player_id);
create index idx_results_game on public.game_results(game_id);
create index idx_votes_game_voter on public.game_votes(game_id, voter_player_id);
create index idx_votes_voted_player on public.game_votes(voted_player_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_updated_at before update on public.players
for each row execute function public.set_updated_at();

create trigger games_updated_at before update on public.games
for each row execute function public.set_updated_at();

create trigger game_results_updated_at before update on public.game_results
for each row execute function public.set_updated_at();

create or replace view public.player_stats_view as
with result_stats as (
  select
    p.id as player_id,
    p.nickname,
    p.avatar_url,
    count(gr.id)::integer as games_played,
    count(*) filter (where gr.finish_position = 1)::integer as wins,
    count(*) filter (where gr.finish_position <= 3)::integer as podiums,
    coalesce(sum(greatest(gr.money_earned, 0)), 0)::numeric(10,2) as total_money_earned,
    coalesce(sum(gr.money_earned), 0)::numeric(10,2) as net_profit,
    coalesce(sum(gr.finishing_points), 0)::integer as finishing_points,
    avg(gr.finish_position)::numeric(10,2) as average_finish,
    avg(gr.money_earned)::numeric(10,2) as average_profit_per_game,
    max(gr.money_earned)::numeric(10,2) as best_night,
    min(gr.money_earned)::numeric(10,2) as worst_night
  from public.players p
  left join public.game_results gr on gr.player_id = p.id
  group by p.id, p.nickname, p.avatar_url
),
vote_stats as (
  select
    voted_player_id as player_id,
    coalesce(sum(points_awarded), 0)::integer as vote_points
  from public.game_votes
  group by voted_player_id
),
combined as (
  select
    rs.*,
    coalesce(vs.vote_points, 0)::integer as vote_points,
    (rs.finishing_points + coalesce(vs.vote_points, 0))::integer as total_points
  from result_stats rs
  left join vote_stats vs on vs.player_id = rs.player_id
)
select
  *,
  case
    when games_played = 0 then 0
    else round(
      least(5, greatest(0,
        case
          when total_points::numeric / games_played <= 2 then total_points::numeric / games_played
          when total_points::numeric / games_played <= 4 then 2 + ((total_points::numeric / games_played - 2) / 2)
          when total_points::numeric / games_played <= 6 then 3 + ((total_points::numeric / games_played - 4) / 2)
          when total_points::numeric / games_played <= 8 then 4 + ((total_points::numeric / games_played - 6) / 2)
          else 5
        end
      )), 2
    )
  end as average_stars,
  dense_rank() over (order by net_profit desc, total_points desc, nickname asc)::integer as money_rank,
  dense_rank() over (order by total_points desc, net_profit desc, nickname asc)::integer as performance_rank
from combined;

alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.game_results enable row level security;
alter table public.game_votes enable row level security;

create policy "public read players" on public.players for select to anon using (true);
create policy "public read games" on public.games for select to anon using (true);
create policy "public read game results" on public.game_results for select to anon using (true);
create policy "public read game votes" on public.game_votes for select to anon using (true);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
