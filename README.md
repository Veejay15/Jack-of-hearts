# Jack of Hearts

A 6-player social deduction web game inspired by *Alice in Borderland*. Each player wears a hidden suit (♠ ♣ ♦ ♥) that only the others can see. Players whisper suit recommendations to each other for 3 minutes, then have 10 seconds to guess their own suit. One hidden player is the **Jack of Hearts** who lies to eliminate everyone. Players win when the Jack is eliminated; the Jack wins by being the last one standing.

Designed for a remote team's Thursday fun-time. Deploys to Vercel.

## How to play

1. The host clicks **Create room** and shares the 6-character code.
2. The other players join with their name + the room code (4–8 players total).
3. Host clicks **Start game**. The server secretly picks one player as the Jack of Hearts and gives every player a random suit.
4. **Discussion (3 min)** — each player sees everyone else's suit but not their own. Use the suit buttons under each other player to whisper a recommendation: "I think your suit is ♠." Only the recipient sees the message.
5. **Guess (10 s)** — pick the suit you believe you have. Wrong = eliminated.
6. Survivors get fresh random suits and play again. Game ends when the Jack is dead (players win) or only the Jack remains (Jack wins).

We assume the team is on Zoom/Discord during the round — there's no in-app voice or text chat.

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Pusher Channels for realtime broadcasts
- Upstash Redis for game state (Vercel-integrated)
- Client-driven idempotent timer transitions (no extra cron service needed)

## Local setup

```sh
npm install
cp .env.local.example .env.local
# fill in Pusher + Upstash creds, generate APP_SECRET with: openssl rand -hex 32
npm run dev
```

Then open six incognito browser windows at <http://localhost:3000>, create a room in the first, and join from the rest with the printed code.

### Required external services

| Service | Why | Free tier |
| --- | --- | --- |
| [Pusher Channels](https://pusher.com/channels) | Realtime room + private-player events | 100 concurrent, 200k messages/day |
| [Upstash Redis](https://upstash.com/) | Authoritative game state | 10k commands/day |

Create one app in each, copy credentials into `.env.local`, then the duplicated `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` values must match the server-side ones.

## Tests

```sh
npm test
```

Covers the pure game logic: suit assignment, win condition, round resolution, next-round setup.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Under **Storage**, add the official **Upstash Redis** integration — it auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. Add the remaining env vars from `.env.local.example` (Pusher creds + `APP_SECRET`).
5. Deploy. Share the URL with the team for the next Thursday session.

## Anti-cheat notes

- The server's per-client snapshot **never sends a player their own suit** until the round resolves — so opening dev tools doesn't reveal it.
- `jackId` is only emitted in payloads after the game ends.
- Recommendations are sent on per-player private channels; Pusher auth at `/api/pusher/auth` rejects any subscription where the channel name doesn't match the requester's player id.

## Files

- `lib/game.ts` — pure round/win logic (unit-tested).
- `lib/state-projection.ts` — strips secrets out of state before sending it to a client.
- `lib/auth.ts` — HMAC-signed player tokens.
- `lib/redis.ts` — Upstash wrapper.
- `app/api/rooms/...` — room creation, join, start, recommend, guess, advance, reset, state.
- `app/api/pusher/auth/route.ts` — channel subscription auth.
- `app/room/[code]/page.tsx` — single page that renders the right component for the current phase.
- `components/` — `Lobby`, `DiscussionRound`, `GuessPhase`, `ResultScreen`, `GameOver`, plus shared bits.

## Known limitations

- If every client disconnects mid-round, no one calls `/advance` and the timer stalls. Acceptable for a synchronous team session; if it ever bites, swap in [Upstash QStash](https://upstash.com/docs/qstash) to schedule transitions server-side.
- No reconnect grace period — if a player closes their tab, refreshing within 6 hours rejoins from `sessionStorage`. If they wipe storage, they'd need a new join (and the room is past lobby).
