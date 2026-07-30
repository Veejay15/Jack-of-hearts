import Pusher from "pusher";

let _server: Pusher | null = null;

export function pusherServer(): Pusher {
  if (_server) return _server;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } =
    process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    throw new Error(
      "Missing PUSHER_APP_ID / PUSHER_KEY / PUSHER_SECRET / PUSHER_CLUSTER env vars",
    );
  }
  _server = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return _server;
}

export const channels = {
  presenceRoom: (code: string) => `presence-room-${code}`,
  privateRoom: (code: string) => `private-room-${code}`,
  privatePlayer: (playerId: string) => `private-player-${playerId}`,
};

export const events = {
  ROOM_UPDATED: "room-updated",
  ROUND_STARTED: "round-started",
  PHASE_CHANGED: "phase-changed",
  ROUND_RESULT: "round-result",
  GAME_OVER: "game-over",
  RECOMMENDATION: "recommendation",
  REWARD_ASSIGNED: "reward-assigned",
} as const;
