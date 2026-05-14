import { NextResponse } from "next/server";
import { z } from "zod";
import { makeToken } from "@/lib/auth";
import { channels, events, pusherServer } from "@/lib/pusher";
import { getRoom, saveRoom } from "@/lib/redis";
import { newPlayerId } from "@/lib/room-code";
import { MAX_PLAYERS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(1).max(24),
  avatarSeed: z.string().trim().min(1).max(64).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code.toUpperCase();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { name, avatarSeed } = parsed.data;

  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.phase !== "lobby") {
    return NextResponse.json(
      { error: "Game already started" },
      { status: 409 },
    );
  }
  if (Object.keys(room.players).length >= MAX_PLAYERS) {
    return NextResponse.json({ error: "Room is full" }, { status: 409 });
  }
  if (
    Object.values(room.players).some(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return NextResponse.json({ error: "Name already taken" }, { status: 409 });
  }

  const playerId = newPlayerId();
  const now = Date.now();
  room.players[playerId] = {
    id: playerId,
    name,
    avatarSeed: avatarSeed ?? playerId,
    suit: null,
    alive: true,
    joinedAt: now,
  };
  await saveRoom(room);

  await pusherServer().trigger(channels.privateRoom(code), events.ROOM_UPDATED, {
    reason: "joined",
  });

  const token = makeToken({ code, playerId, isHost: false });
  return NextResponse.json({ code, playerId, token });
}
