import type { ClientGameState, GameState } from "./types";

/**
 * Project the authoritative server state into the view a specific client
 * is allowed to see:
 *  - their own suit is hidden until the round resolves
 *  - the Jack identity is hidden until game-over
 */
export function projectForClient(
  state: GameState,
  viewerId: string,
): ClientGameState {
  const players = Object.values(state.players)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatarSeed: p.avatarSeed ?? p.id,
      suit: p.id === viewerId ? null : p.suit,
      alive: p.alive,
    }));

  const me = state.players[viewerId];
  const isJack = state.jackId !== null && state.jackId === viewerId;
  const you = me
    ? {
        id: me.id,
        name: me.name,
        avatarSeed: me.avatarSeed ?? me.id,
        alive: me.alive,
        isJack,
      }
    : {
        id: viewerId,
        name: "?",
        avatarSeed: viewerId,
        alive: false,
        isJack: false,
      };

  return {
    code: state.code,
    hostId: state.hostId,
    phase: state.phase,
    roundNumber: state.roundNumber,
    phaseStartedAt: state.phaseStartedAt,
    phaseEndsAt: state.phaseEndsAt,
    you,
    players,
    jackId: state.phase === "game-over" ? state.jackId : null,
    guesses: state.phase === "result" || state.phase === "game-over"
      ? state.guesses
      : {},
    history: state.history,
    winner: state.winner,
    rewards: state.phase === "game-over" ? state.rewards ?? [] : [],
    usedQuestions:
      state.phase === "game-over" ? state.usedQuestions ?? [] : [],
  };
}
