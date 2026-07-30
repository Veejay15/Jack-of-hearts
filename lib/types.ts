export const SUITS = ["spade", "club", "diamond", "heart"] as const;
export type Suit = (typeof SUITS)[number];

export type Phase =
  | "lobby"
  | "discussion"
  | "guess"
  | "result"
  | "game-over";

export type Winner = "players" | "jack" | null;

/**
 * Maximum rounds before a game ends in a draw. Equal to the total number
 * of players who ever joined the room (alive + eliminated), so e.g. an
 * 8-player game caps at 8 rounds.
 */
export function maxRoundsFor(playerCount: number): number {
  return Math.max(1, playerCount);
}

export type Player = {
  id: string;
  name: string;
  avatarSeed: string;
  suit: Suit | null;
  alive: boolean;
  joinedAt: number;
};

export type RoundHistoryEntry = {
  round: number;
  outcomes: Array<{
    playerId: string;
    name: string;
    actualSuit: Suit;
    guess: Suit | null;
    survived: boolean;
  }>;
};

/**
 * A post-game forfeit: `askerId` (a winner) picked `question` for
 * `targetId` (a loser) to answer out loud on the call.
 */
export type RewardAssignment = {
  askerId: string;
  targetId: string;
  category: string;
  question: string;
};

export type GameState = {
  code: string;
  hostId: string;
  phase: Phase;
  roundNumber: number;
  phaseStartedAt: number;
  phaseEndsAt: number;
  players: Record<string, Player>;
  jackId: string | null;
  guesses: Record<string, Suit>;
  history: RoundHistoryEntry[];
  winner: Winner;
  // Optional so rooms created before this field existed still parse.
  rewards?: RewardAssignment[];
};

export const DISCUSSION_MS = 1 * 60 * 1000;
export const GUESS_MS = 60 * 1000;
export const RESULT_MS = 8 * 1000;
export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 4;

/**
 * What the server sends to a specific client. Strips secret-bearing fields:
 * - other players' suits are visible, the requester's own suit is null
 * - jackId is hidden until game-over
 */
export type ClientGameState = Omit<GameState, "players" | "jackId"> & {
  you: {
    id: string;
    name: string;
    avatarSeed: string;
    alive: boolean;
    isJack: boolean;
  };
  players: Array<{
    id: string;
    name: string;
    avatarSeed: string;
    suit: Suit | null; // null for self mid-round, or for everyone in lobby
    alive: boolean;
  }>;
  jackId: string | null; // only populated when phase === 'game-over'
};

export type Recommendations = Record<string, Suit>; // senderId -> suggested suit
