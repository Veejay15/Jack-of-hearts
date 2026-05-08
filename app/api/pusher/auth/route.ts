import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pusher's client SDK posts here with `socket_id`, `channel_name`, plus our
 * own player token. We accept the subscription only if the token's playerId
 * matches the channel name (for private-player-* channels) or the room code
 * (for room channels).
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channelName = String(form.get("channel_name") ?? "");
  const tokenStr = String(form.get("token") ?? "");
  if (!socketId || !channelName || !tokenStr) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const token = verifyToken(tokenStr);
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const ok = (() => {
    if (channelName === `private-room-${token.code}`) return true;
    if (channelName === `presence-room-${token.code}`) return true;
    if (channelName === `private-player-${token.playerId}`) return true;
    return false;
  })();
  if (!ok) {
    return NextResponse.json({ error: "Forbidden channel" }, { status: 403 });
  }

  if (channelName.startsWith("presence-")) {
    const auth = pusherServer().authorizeChannel(socketId, channelName, {
      user_id: token.playerId,
      user_info: { code: token.code },
    });
    return NextResponse.json(auth);
  }
  const auth = pusherServer().authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}
