import { NextResponse } from "next/server";
import { z } from "zod";
import { tokenFromHeaders } from "@/lib/auth";
import { channels, events, pusherServer } from "@/lib/pusher";
import { getRoom, saveRoom } from "@/lib/redis";
import { SUITS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ suit: z.enum(SUITS) });

export async function POST(
  req: Request,
  { params }: { params: { code: string } },
) {
  const code = params.code.toUpperCase();
  const auth = tokenFromHeaders(req.headers);
  if (!auth || auth.code !== code) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.phase !== "guess") {
    return NextResponse.json(
      { error: "Not in guess phase" },
      { status: 409 },
    );
  }
  const me = room.players[auth.playerId];
  if (!me?.alive) {
    return NextResponse.json(
      { error: "You are eliminated" },
      { status: 409 },
    );
  }
  if (room.guesses[me.id]) {
    return NextResponse.json(
      { error: "Guess already locked" },
      { status: 409 },
    );
  }

  room.guesses[me.id] = parsed.data.suit;
  await saveRoom(room);

  // Notify everyone that a guess has been locked (without revealing which suit).
  await pusherServer().trigger(
    channels.privateRoom(code),
    events.PHASE_CHANGED,
    { reason: "guess-locked", playerId: me.id },
  );

  return NextResponse.json({ ok: true });
}
