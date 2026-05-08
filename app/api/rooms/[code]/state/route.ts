import { NextResponse } from "next/server";
import { tokenFromHeaders } from "@/lib/auth";
import { getRecommendations, getRoom } from "@/lib/redis";
import { projectForClient } from "@/lib/state-projection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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
  if (!room.players[auth.playerId]) {
    return NextResponse.json({ error: "Not in room" }, { status: 403 });
  }

  const view = projectForClient(room, auth.playerId);
  const recommendations = await getRecommendations(code, auth.playerId);

  return NextResponse.json({ state: view, recommendations });
}
