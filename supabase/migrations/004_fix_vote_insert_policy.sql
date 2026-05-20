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
    where g.id = game_votes.game_id
      and g.status = 'voting_open'
  )
  and exists (
    select 1
    from public.game_results voter_result
    where voter_result.game_id = game_votes.game_id
      and voter_result.player_id = game_votes.voter_player_id
  )
  and exists (
    select 1
    from public.game_results voted_result
    where voted_result.game_id = game_votes.game_id
      and voted_result.player_id = game_votes.voted_player_id
  )
);
