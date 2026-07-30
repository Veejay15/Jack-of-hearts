import { NextResponse } from "next/server";
import { z } from "zod";
import { makeToken } from "@/lib/auth";
import { saveRoom } from "@/lib/redis";
import { newPlayerId, newRoomCode } from "@/lib/room-code";
import type { GameState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  hostName: z.string().trim().min(1).max(24),
  avatarSeed: z.string().trim().min(1).max(64).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { hostName, avatarSeed } = parsed.data;

  const code = newRoomCode();
  const hostId = newPlayerId();
  const now = Date.now();

  const state: GameState = {
    code,
    hostId,
    phase: "lobby",
    roundNumber: 0,
    phaseStartedAt: now,
    phaseEndsAt: now,
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        avatarSeed: avatarSeed ?? hostId,
        suit: null,
        alive: true,
        joinedAt: now,
      },
    },
    jackId: null,
    guesses: {},
    history: [],
    winner: null,
    rewards: [],
  };
  await saveRoom(state);

  const token = makeToken({ code, playerId: hostId, isHost: true });
  return NextResponse.json({ code, playerId: hostId, token });
}
