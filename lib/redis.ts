import { Redis } from "@upstash/redis";
import type { GameState, Recommendations, Suit } from "./types";

const ROOM_TTL_SECONDS = 6 * 60 * 60; // 6 hours

let _redis: Redis | null = null;
function client(): Redis {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars",
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const roomKey = (code: string) => `room:${code}`;
const recsKey = (code: string, recipientId: string) =>
  `room:${code}:recs:${recipientId}`;

export async function getRoom(code: string): Promise<GameState | null> {
  const raw = await client().get<GameState>(roomKey(code));
  return raw ?? null;
}

export async function saveRoom(state: GameState): Promise<void> {
  await client().set(roomKey(state.code), state, { ex: ROOM_TTL_SECONDS });
}

/**
 * Compare-and-set on phase. Returns the new state if applied, or null if the
 * current room is already in the expected next phase / has been changed by
 * another caller. Used by /advance to keep timer transitions idempotent.
 */
export async function casPhase(
  code: string,
  expectedPhase: GameState["phase"],
  produceNext: (current: GameState) => GameState,
): Promise<GameState | null> {
  const current = await getRoom(code);
  if (!current) return null;
  if (current.phase !== expectedPhase) return null;
  const next = produceNext(current);
  await saveRoom(next);
  return next;
}

export async function setRecommendation(
  code: string,
  recipientId: string,
  senderId: string,
  suit: Suit,
): Promise<void> {
  await client().hset(recsKey(code, recipientId), { [senderId]: suit });
  await client().expire(recsKey(code, recipientId), ROOM_TTL_SECONDS);
}

export async function getRecommendations(
  code: string,
  recipientId: string,
): Promise<Recommendations> {
  const data = await client().hgetall<Recommendations>(
    recsKey(code, recipientId),
  );
  return data ?? {};
}

export async function clearAllRecommendations(
  code: string,
  playerIds: string[],
): Promise<void> {
  if (playerIds.length === 0) return;
  await Promise.all(
    playerIds.map((id) => client().del(recsKey(code, id))),
  );
}
