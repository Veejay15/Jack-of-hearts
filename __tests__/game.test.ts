import { describe, expect, it } from "vitest";
import {
  assignSuitsToAlive,
  checkWinCondition,
  pickJackId,
  randomSuit,
  resolveGuesses,
  startNextRound,
} from "../lib/game";
import { type GameState, type Player, SUITS } from "../lib/types";

function seededRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    avatarSeed: id,
    suit: null,
    alive: true,
    joinedAt: 0,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    code: "ABC123",
    hostId: "p1",
    phase: "discussion",
    roundNumber: 1,
    phaseStartedAt: 0,
    phaseEndsAt: 0,
    players: {},
    jackId: null,
    guesses: {},
    history: [],
    winner: null,
    ...overrides,
  };
}

describe("randomSuit", () => {
  it("returns one of the four suits", () => {
    const suit = randomSuit(seededRng([0]));
    expect(SUITS).toContain(suit);
  });
});

describe("pickJackId", () => {
  it("picks a player from the supplied list", () => {
    const id = pickJackId(["a", "b", "c"], seededRng([0.5]));
    expect(id).toBe("b");
  });

  it("throws when no players are provided", () => {
    expect(() => pickJackId([])).toThrow();
  });
});

describe("assignSuitsToAlive", () => {
  it("assigns a suit to alive players and clears suits for eliminated ones", () => {
    const players = {
      p1: makePlayer("p1"),
      p2: makePlayer("p2", { alive: false, suit: "heart" }),
    };
    const next = assignSuitsToAlive(players, seededRng([0]));
    expect(next.p1.suit).toBe("spade");
    expect(next.p2.suit).toBeNull();
  });
});

describe("resolveGuesses", () => {
  it("eliminates players who guessed wrong and survives correct guesses", () => {
    const state = makeState({
      players: {
        p1: makePlayer("p1", { suit: "spade" }),
        p2: makePlayer("p2", { suit: "heart" }),
      },
      guesses: { p1: "spade", p2: "diamond" },
    });
    const next = resolveGuesses(state);
    expect(next.players.p1.alive).toBe(true);
    expect(next.players.p2.alive).toBe(false);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].outcomes).toHaveLength(2);
  });

  it("eliminates players who didn't guess at all", () => {
    const state = makeState({
      players: { p1: makePlayer("p1", { suit: "club" }) },
      guesses: {},
    });
    const next = resolveGuesses(state);
    expect(next.players.p1.alive).toBe(false);
  });
});

describe("checkWinCondition", () => {
  it("returns 'players' when the Jack is dead", () => {
    const state = makeState({
      jackId: "p1",
      players: {
        p1: makePlayer("p1", { alive: false }),
        p2: makePlayer("p2"),
      },
    });
    expect(checkWinCondition(state)).toBe("players");
  });

  it("returns 'jack' when only the Jack is alive", () => {
    const state = makeState({
      jackId: "p1",
      players: {
        p1: makePlayer("p1"),
        p2: makePlayer("p2", { alive: false }),
      },
    });
    expect(checkWinCondition(state)).toBe("jack");
  });

  it("returns null when game continues", () => {
    const state = makeState({
      jackId: "p1",
      players: {
        p1: makePlayer("p1"),
        p2: makePlayer("p2"),
      },
    });
    expect(checkWinCondition(state)).toBeNull();
  });
});

describe("startNextRound", () => {
  it("bumps the round number and re-rolls suits", () => {
    const state = makeState({
      roundNumber: 2,
      players: { p1: makePlayer("p1", { suit: "spade" }) },
      guesses: { p1: "spade" },
    });
    const next = startNextRound(state, seededRng([0.75]));
    expect(next.roundNumber).toBe(3);
    expect(next.players.p1.suit).toBe("heart");
    expect(next.guesses).toEqual({});
  });
});
