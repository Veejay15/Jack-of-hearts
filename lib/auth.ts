import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.APP_SECRET;
  if (!s) throw new Error("Missing APP_SECRET env var");
  return s;
}

export type TokenPayload = {
  code: string;
  playerId: string;
  isHost: boolean;
};

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(p: TokenPayload): string {
  const body = `${p.code}|${p.playerId}|${p.isHost ? "1" : "0"}`;
  const sig = sign(body);
  return `${Buffer.from(body).toString("base64url")}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let body: string;
  try {
    body = Buffer.from(body64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(body);
  if (
    expected.length !== sig.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  const [code, playerId, hostFlag] = body.split("|");
  if (!code || !playerId) return null;
  return { code, playerId, isHost: hostFlag === "1" };
}

/**
 * Extract token from the Authorization header (Bearer scheme) or
 * the x-player-token header. Returns null if absent or invalid.
 */
export function tokenFromHeaders(headers: Headers): TokenPayload | null {
  const auth = headers.get("authorization");
  let raw: string | null = null;
  if (auth?.startsWith("Bearer ")) raw = auth.slice("Bearer ".length);
  raw = raw ?? headers.get("x-player-token");
  if (!raw) return null;
  return verifyToken(raw);
}
