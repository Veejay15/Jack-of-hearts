import { NextResponse } from "next/server";
import { tokenFromHeaders } from "@/lib/auth";
import {
  checkWinCondition,
  resolveGuesses,
  startNextRound,
} from "@/lib/game";
import { channels, events, pusherServer } from "@/lib/pusher";
import {
  clearAllRecommendations,
  getRoom,
  saveRoom,
} from "@/lib/redis";
import {
  DISCUSSION_MS,
  GUESS_MS,
  RESULT_MS,
  type GameState,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Idempotent phase advancer. Any client whose timer hits zero may call this.
 * The server checks `phaseEndsAt` and only advances if the deadline has passed
 * AND the room is still in the source phase. Concurrent calls are safe because
 * we re-read state and compare phase before writing.
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
  // Only members of the room may advance.
  if (!room.players[auth.playerId]) {
    return NextResponse.json({ error: "Not in room" }, { status: 403 });
  }

  const now = Date.now();
  if (now < room.phaseEndsAt) {
    return NextResponse.json({ ok: true, advanced: false });
  }

  let next: GameState | null = null;

  switch (room.phase) {
    case "discussion": {
      next = {
        ...room,
        phase: "guess",
        phaseStartedAt: now,
        phaseEndsAt: now + GUESS_MS,
      };
      break;
    }
    case "guess": {
      const resolved = resolveGuesses(room);
      const winner = checkWinCondition(resolved);
      if (winner) {
        next = {
          ...resolved,
          phase: "game-over",
          winner,
          phaseStartedAt: now,
          phaseEndsAt: now,
        };
      } else {
        next = {
          ...resolved,
          phase: "result",
          phaseStartedAt: now,
          phaseEndsAt: now + RESULT_MS,
        };
      }
      break;
    }
    case "result": {
      const rolled = startNextRound(room);
      next = {
        ...rolled,
        phase: "discussion",
        phaseStartedAt: now,
        phaseEndsAt: now + DISCUSSION_MS,
      };
      // Clear recommendations from the previous round.
      await clearAllRecommendations(code, Object.keys(rolled.players));
      break;
    }
    default:
      return NextResponse.json({ ok: true, advanced: false });
  }

  if (!next) return NextResponse.json({ ok: true, advanced: false });

  await saveRoom(next);

  // Pick the right broadcast event for the new phase.
  if (next.phase === "guess" || next.phase === "discussion") {
    await pusherServer().trigger(
      channels.privateRoom(code),
      next.phase === "discussion" ? events.ROUND_STARTED : events.PHASE_CHANGED,
      {
        phase: next.phase,
        roundNumber: next.roundNumber,
        phaseEndsAt: next.phaseEndsAt,
      },
    );
  } else if (next.phase === "result") {
    await pusherServer().trigger(
      channels.privateRoom(code),
      events.ROUND_RESULT,
      {
        roundNumber: next.roundNumber,
        phaseEndsAt: next.phaseEndsAt,
      },
    );
  } else if (next.phase === "game-over") {
    await pusherServer().trigger(channels.privateRoom(code), events.GAME_OVER, {
      winner: next.winner,
    });
  }

  return NextResponse.json({ ok: true, advanced: true, phase: next.phase });
}
