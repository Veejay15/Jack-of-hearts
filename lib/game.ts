import {
  type GameState,
  type Player,
  type Suit,
  type Winner,
  SUITS,
} from "./types";

export function randomSuit(rng: () => number = Math.random): Suit {
  return SUITS[Math.floor(rng() * SUITS.length)];
}

export function pickJackId(
  playerIds: string[],
  rng: () => number = Math.random,
): string {
  if (playerIds.length === 0) {
    throw new Error("Cannot pick a Jack from zero players");
  }
  return playerIds[Math.floor(rng() * playerIds.length)];
}

export function assignSuitsToAlive(
  players: Record<string, Player>,
  rng: () => number = Math.random,
): Record<string, Player> {
  const next: Record<string, Player> = {};
  for (const [id, p] of Object.entries(players)) {
    next[id] = p.alive ? { ...p, suit: randomSuit(rng) } : { ...p, suit: null };
  }
  return next;
}

/**
 * Resolve a guess phase. Pure: takes current state, returns the next state
 * (without any IO). Players who guessed wrong (or didn't guess) are eliminated.
 */
export function resolveGuesses(state: GameState): GameState {
  const outcomes: GameState["history"][number]["outcomes"] = [];
  const nextPlayers: Record<string, Player> = { ...state.players };

  for (const player of Object.values(state.players)) {
    if (!player.alive || !player.suit) continue;
    const guess = state.guesses[player.id] ?? null;
    const survived = guess === player.suit;
    outcomes.push({
      playerId: player.id,
      name: player.name,
      actualSuit: player.suit,
      guess,
      survived,
    });
    if (!survived) {
      nextPlayers[player.id] = { ...player, alive: false };
    }
  }

  const history = [
    ...state.history,
    { round: state.roundNumber, outcomes },
  ];

  return {
    ...state,
    players: nextPlayers,
    history,
  };
}

export function checkWinCondition(state: GameState): Winner {
  if (!state.jackId) return null;
  const jack = state.players[state.jackId];
  if (!jack) return null;

  if (!jack.alive) return "players";

  const aliveNonJack = Object.values(state.players).filter(
    (p) => p.alive && p.id !== state.jackId,
  );
  if (aliveNonJack.length === 0) return "jack";

  return null;
}

/**
 * Prepare the next round: bump round number, re-roll suits for survivors,
 * clear guesses. Caller is responsible for setting phase + timestamps.
 */
export function startNextRound(
  state: GameState,
  rng: () => number = Math.random,
): GameState {
  return {
    ...state,
    roundNumber: state.roundNumber + 1,
    players: assignSuitsToAlive(state.players, rng),
    guesses: {},
  };
}
