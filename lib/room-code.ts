import { randomBytes } from "node:crypto";

// Avoid easily-confused characters (no 0/O, 1/I, etc.) for human-typed codes.
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PLAYER_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomString(alphabet: string, length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export const newRoomCode = () => randomString(ROOM_ALPHABET, 6);
export const newPlayerId = () => randomString(PLAYER_ALPHABET, 10);
