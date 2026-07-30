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
 *
 * Re-submitting for a target that already has a question REPLACES it (for
 * when someone refuses to answer). The refused question stays burned: it
 * can never be picked again this game.
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
  const used = room.usedQuestions ?? rewards.map((r) => r.question);
  if (used.includes(question)) {
    return NextResponse.json(
      { error: "That question is already used — pick another" },
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
    resolvedTargetId = targetId;
  } else {
    // Players won: surviving non-Jack players each ask the Jack.
    if (me.id === room.jackId || !me.alive) {
      return NextResponse.json(
        { error: "Only surviving winners pick questions" },
        { status: 403 },
      );
    }
    resolvedTargetId = room.jackId;
  }

  // One assignment per (asker, target) pair — a second submission for the
  // same slot replaces the question rather than stacking a new one.
  const slotIndex = rewards.findIndex(
    (r) => r.askerId === me.id && r.targetId === resolvedTargetId,
  );
  const entry = {
    askerId: me.id,
    targetId: resolvedTargetId,
    category,
    question,
  };
  room.rewards =
    slotIndex >= 0
      ? rewards.map((r, i) => (i === slotIndex ? entry : r))
      : [...rewards, entry];
  room.usedQuestions = [...used, question];
  await saveRoom(room);

  await pusherServer().trigger(
    channels.privateRoom(code),
    events.REWARD_ASSIGNED,
    { askerId: me.id, targetId: resolvedTargetId },
  );

  return NextResponse.json({ ok: true });
}
