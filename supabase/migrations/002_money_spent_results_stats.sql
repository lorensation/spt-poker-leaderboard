alter table public.game_results
  add column if not exists money_spent numeric(10,2) not null default 0;

alter table public.game_results
  alter column finish_position drop not null;

alter table public.game_results
  drop constraint if exists game_results_finish_position_check;

alter table public.game_results
  add constraint game_results_finish_position_check
  check (finish_position is null or finish_position between 1 and 9);

alter table public.game_results
  drop constraint if exists game_results_game_id_finish_position_key;

create unique index if not exists game_results_game_finish_position_qualified_key
  on public.game_results(game_id, finish_position)
  where finish_position is not null;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'game_results'
      and column_name = 'net_profit'
  ) then
    alter table public.game_results
      add column net_profit numeric(10,2)
      generated always as (money_earned - money_spent) stored;
  end if;
end $$;

update public.game_votes
set points_awarded = case vote_rank
  when 1 then 6
  when 2 then 4
  when 3 then 2
  else points_awarded
end;

alter table public.game_votes
  drop constraint if exists game_votes_points_awarded_check;

alter table public.game_votes
  add constraint game_votes_points_awarded_check
  check (points_awarded in (2,4,6));

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
