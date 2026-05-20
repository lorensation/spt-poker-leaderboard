create or replace function public.enforce_game_vote_participants()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.game_results gr
    where gr.game_id = new.game_id
      and gr.player_id = new.voter_player_id
  ) then
    raise exception 'Only players who participated in the game can vote.';
  end if;

  if not exists (
    select 1
    from public.game_results gr
    where gr.game_id = new.game_id
      and gr.player_id = new.voted_player_id
  ) then
    raise exception 'Votes can only be cast for players who participated in the game.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_game_vote_participants_before_write on public.game_votes;

create trigger enforce_game_vote_participants_before_write
before insert or update of game_id, voter_player_id, voted_player_id on public.game_votes
for each row execute function public.enforce_game_vote_participants();
