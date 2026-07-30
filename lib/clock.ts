// Server-time synchronization. Countdowns must agree with the server's clock
// (which owns phaseEndsAt), not the player's machine — a local clock running
// a minute fast makes the timer hit 0:00 while the server still refuses to
// advance, freezing the game until the skew elapses.
let offsetMs = 0;

/** Record the offset between the server's clock and this machine's. */
export function syncServerClock(serverNowMs: number): void {
  offsetMs = serverNowMs - Date.now();
}

/** Current time as the server sees it (± one network round trip). */
export function serverNow(): number {
  return Date.now() + offsetMs;
}
