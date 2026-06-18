update public.poker_clock_state
set
  levels = (
    select jsonb_agg(
      case
        when level->>'type' = 'blind' and not (level ? 'ante') then
          jsonb_set(level, '{ante}', to_jsonb(coalesce((level->>'smallBlind')::integer, 0)))
        else level
      end
      order by ordinality
    )
    from jsonb_array_elements(levels) with ordinality as existing_levels(level, ordinality)
  ),
  updated_at = now()
where exists (
  select 1
  from jsonb_array_elements(levels) as existing_levels(level)
  where level->>'type' = 'blind'
    and not (level ? 'ante')
);
