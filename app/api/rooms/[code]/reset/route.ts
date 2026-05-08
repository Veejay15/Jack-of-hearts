import { NextResponse } from "next/server";
import { tokenFromHeaders } from "@/lib/auth";
import { channels, events, pusherServer } from "@/lib/pusher";
import {
  clearAllRecommendations,
  getRoom,
  saveRoom,
} from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resets a finished room back to the lobby so the same group can play again.
 * Host-only. All players (alive or eliminated) are revived as lobby members.
 */
export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code.toUpperCase();
  const auth = tokenFromHeaders(req.headers);
  if (!auth || auth.code !== code) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (auth.playerId !== room.hostId) {
    return NextResponse.json({ error: "Host only" }, { status: 403 });
  }
  if (room.phase !== "game-over") {
    return NextResponse.json(
      { error: "Game still in progress" },
      { status: 409 },
    );
  }

  const now = Date.now();
  for (const id of Object.keys(room.players)) {
    room.players[id] = {
      ...room.players[id],
      alive: true,
      suit: null,
    };
  }
  room.phase = "lobby";
  room.roundNumber = 0;
  room.jackId = null;
  room.guesses = {};
  room.history = [];
  room.winner = null;
  room.phaseStartedAt = now;
  room.phaseEndsAt = now;
  await saveRoom(room);
  await clearAllRecommendations(code, Object.keys(room.players));

  await pusherServer().trigger(channels.privateRoom(code), events.ROOM_UPDATED, {
    reason: "reset",
  });

  return NextResponse.json({ ok: true });
}
