import { NextResponse } from "next/server";
import { tokenFromHeaders } from "@/lib/auth";
import { assignSuitsToAlive, pickJackId } from "@/lib/game";
import { channels, events, pusherServer } from "@/lib/pusher";
import { getRoom, saveRoom } from "@/lib/redis";
import { DISCUSSION_MS, MIN_PLAYERS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json(
      { error: "Only the host can start the game" },
      { status: 403 },
    );
  }
  if (room.phase !== "lobby") {
    return NextResponse.json({ error: "Already started" }, { status: 409 });
  }

  const ids = Object.keys(room.players);
  if (ids.length < MIN_PLAYERS) {
    return NextResponse.json(
      { error: `Need at least ${MIN_PLAYERS} players` },
      { status: 409 },
    );
  }

  const now = Date.now();
  room.jackId = pickJackId(ids);
  room.players = assignSuitsToAlive(room.players);
  room.phase = "discussion";
  room.roundNumber = 1;
  room.phaseStartedAt = now;
  room.phaseEndsAt = now + DISCUSSION_MS;
  room.guesses = {};
  room.rewards = [];
  room.usedQuestions = [];
  await saveRoom(room);

  await pusherServer().trigger(channels.privateRoom(code), events.ROUND_STARTED, {
    roundNumber: room.roundNumber,
    phaseEndsAt: room.phaseEndsAt,
  });

  return NextResponse.json({ ok: true });
}
