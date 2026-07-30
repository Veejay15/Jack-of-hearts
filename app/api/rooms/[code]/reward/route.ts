import { NextResponse } from "next/server";
import { z } from "zod";
import { tokenFromHeaders } from "@/lib/auth";
import { channels, events, pusherServer } from "@/lib/pusher";
import { findRewardQuestion } from "@/lib/questions";
import { getRoom, saveRoom } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  category: z.string().min(1),
  question: z.string().min(1).max(300),
  targetId: z.string().optional(),
});

/**
 * Post-game forfeit. If the Jack won, the Jack picks a question for every
 * losing player — one each, no repeated questions. If the players won,
 * every surviving player picks one question for the Jack — each question
 * may only be used once.
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
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { category, question, targetId } = parsed.data;

  if (!findRewardQuestion(category, question)) {
    return NextResponse.json(
      { error: "Unknown question" },
      { status: 400 },
    );
  }

  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  const me = room.players[auth.playerId];
  if (!me) {
    return NextResponse.json({ error: "Not in room" }, { status: 403 });
  }
  if (room.phase !== "game-over" || !room.winner || !room.jackId) {
    return NextResponse.json(
      { error: "The game is not over yet" },
      { status: 409 },
    );
  }

  const rewards = room.rewards ?? [];
  if (rewards.some((r) => r.question === question)) {
    return NextResponse.json(
      { error: "That question is already taken — pick another" },
      { status: 409 },
    );
  }

  let resolvedTargetId: string;
  if (room.winner === "jack") {
    // Only the winning Jack asks, one question per losing player.
    if (me.id !== room.jackId) {
      return NextResponse.json(
        { error: "Only the Jack picks the questions" },
        { status: 403 },
      );
    }
    if (!targetId || !room.players[targetId] || targetId === room.jackId) {
      return NextResponse.json(
        { error: "Pick a losing player to answer" },
        { status: 400 },
      );
    }
    if (rewards.some((r) => r.targetId === targetId)) {
      return NextResponse.json(
        { error: "That player already has a question" },
        { status: 409 },
      );
    }
    resolvedTargetId = targetId;
  } else {
    // Players won: surviving non-Jack players each ask the Jack once.
    if (me.id === room.jackId || !me.alive) {
      return NextResponse.json(
        { error: "Only surviving winners pick questions" },
        { status: 403 },
      );
    }
    if (rewards.some((r) => r.askerId === me.id)) {
      return NextResponse.json(
        { error: "You already picked a question" },
        { status: 409 },
      );
    }
    resolvedTargetId = room.jackId;
  }

  room.rewards = [
    ...rewards,
    { askerId: me.id, targetId: resolvedTargetId, category, question },
  ];
  await saveRoom(room);

  await pusherServer().trigger(
    channels.privateRoom(code),
    events.REWARD_ASSIGNED,
    { askerId: me.id, targetId: resolvedTargetId },
  );

  return NextResponse.json({ ok: true });
}
