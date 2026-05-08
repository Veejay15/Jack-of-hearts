import { NextResponse } from "next/server";
import { z } from "zod";
import { tokenFromHeaders } from "@/lib/auth";
import { channels, events, pusherServer } from "@/lib/pusher";
import { getRoom, setRecommendation } from "@/lib/redis";
import { SUITS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  targetId: z.string().min(1),
  suit: z.enum(SUITS),
});

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
  const { targetId, suit } = parsed.data;

  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.phase !== "discussion") {
    return NextResponse.json(
      { error: "Recommendations only allowed during discussion" },
      { status: 409 },
    );
  }
  const sender = room.players[auth.playerId];
  const target = room.players[targetId];
  if (!sender?.alive || !target?.alive) {
    return NextResponse.json(
      { error: "Both players must be alive" },
      { status: 409 },
    );
  }
  if (sender.id === target.id) {
    return NextResponse.json(
      { error: "Cannot recommend a suit to yourself" },
      { status: 409 },
    );
  }

  await setRecommendation(code, target.id, sender.id, suit);

  await pusherServer().trigger(
    channels.privatePlayer(target.id),
    events.RECOMMENDATION,
    {
      senderId: sender.id,
      senderName: sender.name,
      suit,
      at: Date.now(),
    },
  );

  return NextResponse.json({ ok: true });
}
