with scored_results as (
  select
    gr.id,
    case gr.finish_position
      when 1 then 25
      when 2 then 20
      when 3 then 15
      when 4 then 10
      when 5 then 8
      when 6 then 6
      when 7 then 4
      when 8 then 2
      when 9 then 1
      else 0
    end as base_points,
    count(*) filter (where gr.finish_position is not null)
      over (partition by gr.game_id, gr.finish_position) as tied_player_count
  from public.game_results gr
)
update public.game_results gr
set finishing_points = case
  when scored_results.base_points = 0 then 0
  when scored_results.tied_player_count > 1 then greatest(0, scored_results.base_points - scored_results.tied_player_count)
  else scored_results.base_points
end
from scored_results
where scored_results.id = gr.id;
