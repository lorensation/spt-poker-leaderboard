# Home Poker Leaderboard

Home Poker Leaderboard is a lightweight web app for tracking private poker nights with friends.

The app includes two leaderboard systems:
1. Money Leaderboard: ranks players by all-time net money earned.
2. Performance Leaderboard: ranks players by accumulated performance points from finishing positions and peer-voted MVP bonuses.

Players are created manually by the admin. Existing players identify themselves with a Supabase Auth email magic link tied to their admin-managed player record. Each player has a public read-only stats page and a private `/profile` page for their own stats, history, votes, and avatar updates.

Admins can create and manage poker nights, enter final positions, record money earned, reset votes, and maintain historical results.

## Player access flow

1. Admin creates a player in `/admin` and optionally links the player's email.
2. The player opens `/identify`, selects their existing player name, and enters that linked email.
3. Supabase sends a magic link. After the callback, the Auth user is linked to the existing player record.
4. `/profile` and voting use the authenticated player identity instead of a browser `localStorage` token.

Players cannot create new player records from the public app. If a player is missing or their email is wrong, the admin must update the player in `/admin`.

## Supabase notes

The database includes RLS policies for public leaderboard reads, player-owned avatar updates, and authenticated vote inserts. Admin mutations still run through server-side checks and the Supabase secret key.

For magic links, configure the Supabase Auth URL settings to allow the app URL from `NEXT_PUBLIC_SITE_URL` and the callback path `/auth/callback`.

Use the email template in `supabase/email-templates/player-login.html` for the Supabase Auth "Magic Link" email template. Use `supabase/email-templates/player-login-subject.txt` as the subject.
