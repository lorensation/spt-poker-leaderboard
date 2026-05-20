create table if not exists public.player_identities (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  email text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_identities_email_normalized check (email = lower(trim(email)))
);

alter table public.players
  add column if not exists created_by_admin boolean not null default true;

create unique index if not exists player_identities_player_id_key
  on public.player_identities(player_id);

create unique index if not exists player_identities_email_key
  on public.player_identities(email);

create unique index if not exists player_identities_auth_user_id_key
  on public.player_identities(auth_user_id)
  where auth_user_id is not null;

create trigger player_identities_updated_at before update on public.player_identities
for each row execute function public.set_updated_at();

create or replace function public.current_player_id()
returns uuid
language sql
security invoker
stable
set search_path = ''
as $$
  select pi.player_id
  from public.player_identities pi
  where pi.auth_user_id = (select auth.uid())
  limit 1
$$;

create or replace function public.vote_points_for_rank(rank integer)
returns integer
language sql
security invoker
immutable
set search_path = ''
as $$
  select case rank
    when 1 then 6
    when 2 then 4
    when 3 then 2
    else null
  end
$$;

alter table public.player_identities enable row level security;

drop policy if exists "users read own player identity" on public.player_identities;
create policy "users read own player identity"
on public.player_identities
for select
to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "public read players" on public.players;
create policy "public read players"
on public.players
for select
to anon, authenticated
using (true);

drop policy if exists "players update own avatar" on public.players;
create policy "players update own avatar"
on public.players
for update
to authenticated
using (id = public.current_player_id())
with check (id = public.current_player_id());

drop policy if exists "public read games" on public.games;
create policy "public read games"
on public.games
for select
to anon, authenticated
using (true);

drop policy if exists "public read game results" on public.game_results;
create policy "public read game results"
on public.game_results
for select
to anon, authenticated
using (true);

drop policy if exists "public read game votes" on public.game_votes;
create policy "public read game votes"
on public.game_votes
for select
to anon, authenticated
using (true);

alter table public.game_votes
  drop constraint if exists game_votes_points_match_rank_check;

alter table public.game_votes
  add constraint game_votes_points_match_rank_check
  check (points_awarded = public.vote_points_for_rank(vote_rank));

drop policy if exists "identified players insert own votes" on public.game_votes;
create policy "identified players insert own votes"
on public.game_votes
for insert
to authenticated
with check (
  voter_player_id = public.current_player_id()
  and voter_player_id <> voted_player_id
  and points_awarded = public.vote_points_for_rank(vote_rank)
  and exists (
    select 1
    from public.games g
    where g.id = game_id
      and g.status = 'voting_open'
  )
  and exists (
    select 1
    from public.game_results voter_result
    where voter_result.game_id = game_id
      and voter_result.player_id = voter_player_id
  )
  and exists (
    select 1
    from public.game_results voted_result
    where voted_result.game_id = game_id
      and voted_result.player_id = voted_player_id
  )
);

grant select on public.players to anon, authenticated;
grant select on public.games to anon, authenticated;
grant select on public.game_results to anon, authenticated;
grant select on public.game_votes to anon, authenticated;
grant select on public.player_stats_view to anon, authenticated;
grant select on public.player_identities to authenticated;
grant insert on public.game_votes to authenticated;
revoke update on public.players from authenticated;
grant update (avatar_url) on public.players to authenticated;

create index if not exists idx_game_votes_voter_player_id
  on public.game_votes(voter_player_id);

create or replace view public.player_stats_view
with (security_invoker = true)
as
with result_stats as (
  select
    p.id as player_id,
    p.nickname,
    p.avatar_url,
    count(gr.id)::integer as games_played,
    count(*) filter (where gr.finish_position = 1)::integer as wins,
    count(*) filter (where gr.finish_position <= 3)::integer as podiums,
    coalesce(sum(greatest(gr.money_earned, 0)), 0)::numeric(10,2) as total_money_earned,
    coalesce(sum(gr.net_profit), 0)::numeric(10,2) as net_profit,
    coalesce(sum(gr.finishing_points), 0)::integer as finishing_points,
    avg(gr.finish_position)::numeric(10,2) as average_finish,
    avg(gr.net_profit)::numeric(10,2) as average_profit_per_game,
    max(gr.net_profit)::numeric(10,2) as best_night,
    min(gr.net_profit)::numeric(10,2) as worst_night
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

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
