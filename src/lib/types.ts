export type GameStatus = "draft" | "voting_open" | "voting_closed" | "completed";
export type LeaderboardKind = "money" | "points";

export type ActionResult<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; error?: string };

export type Player = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  edit_token_hash?: string | null;
  created_by_admin?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PlayerIdentity = {
  id: string;
  player_id: string;
  email: string;
  auth_user_id: string | null;
  claimed_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Game = {
  id: string;
  title: string;
  played_at: string;
  status: GameStatus;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type GameResult = {
  id: string;
  game_id: string;
  player_id: string;
  finish_position: number | null;
  money_spent: number;
  money_earned: number;
  net_profit: number;
  finishing_points: number;
  notes: string | null;
  players?: Player;
};

export type GameVote = {
  id: string;
  game_id: string;
  voter_player_id: string;
  voted_player_id: string;
  vote_rank: 1 | 2 | 3;
  points_awarded: number;
  created_at: string;
};

export type PlayerStats = {
  player_id: string;
  nickname: string;
  avatar_url: string | null;
  games_played: number;
  wins: number;
  podiums: number;
  total_money_earned: number;
  net_profit: number;
  finishing_points: number;
  vote_points: number;
  total_points: number;
  average_finish: number | null;
  average_profit_per_game: number | null;
  average_stars: number;
  money_rank: number;
  performance_rank: number;
  best_night: number | null;
  worst_night: number | null;
};

export type GameCardData = Game & {
  player_count: number;
  total_pot: number;
  winner: Player | null;
  top_three: Array<GameResult & { players: Player }>;
};

export type GameDetailData = GameCardData & {
  results: Array<GameResult & { players: Player }>;
  votes: Array<GameVote & { voted_player?: Player; voter_player?: Player }>;
  vote_totals: Array<{ player: Player; points: number; firsts: number }>;
  mvp: { player: Player; points: number; firsts: number } | null;
};

export type PlayerVoteHistory = GameVote & {
  games: { id: string; title: string; played_at: string };
  voted_player: Player;
};
