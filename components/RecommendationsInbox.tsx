"use client";

import SuitIcon from "./SuitIcon";
import type { ClientGameState, Suit } from "@/lib/types";

export default function RecommendationsInbox({
  recommendations,
  state,
}: {
  recommendations: Record<string, Suit>;
  state: ClientGameState;
}) {
  const nameOf = (id: string) =>
    state.players.find((p) => p.id === id)?.name ?? "?";
  // Redis hashes return fields in arbitrary order, so each poll could
  // reshuffle the list — pin it to the senders' join order instead.
  const joinOrder = new Map(state.players.map((p, i) => [p.id, i]));
  const entries = Object.entries(recommendations).sort(
    (a, b) =>
      (joinOrder.get(a[0]) ?? Number.MAX_SAFE_INTEGER) -
      (joinOrder.get(b[0]) ?? Number.MAX_SAFE_INTEGER),
  );
  return (
    <aside className="rounded-2xl border border-white/10 bg-velvet/60 p-5">
      <h3 className="text-sm uppercase tracking-[0.25em] text-gold/80">
        Whispers about you
      </h3>
      <p className="mt-1 text-xs text-white/50">
        Only you can see these. Some of them are lies.
      </p>
      <ul className="mt-4 space-y-2">
        {entries.length === 0 && (
          <li className="text-sm italic text-white/40">
            No one has recommended a suit yet.
          </li>
        )}
        {entries.map(([senderId, suit]) => (
          <li
            key={senderId}
            className="flex items-center justify-between rounded-lg bg-ink/50 px-3 py-2"
          >
            <span className="text-sm">{nameOf(senderId)} says</span>
            <span className="text-2xl">
              <SuitIcon suit={suit} />
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
