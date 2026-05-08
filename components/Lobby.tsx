"use client";

import { useState } from "react";
import type { ClientGameState } from "@/lib/types";
import { MIN_PLAYERS } from "@/lib/types";

export default function Lobby({
  state,
  isHost,
  onStart,
}: {
  state: ClientGameState;
  isHost: boolean;
  onStart: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const count = state.players.length;
  const canStart = count >= MIN_PLAYERS;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-velvet/60 p-6 text-center backdrop-blur">
        <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
          Room code
        </div>
        <div className="mt-2 font-mono text-4xl font-bold tracking-[0.4em]">
          {state.code}
        </div>
        <div className="mt-2 text-sm text-white/60">
          Share this code with your team to join.
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-velvet/60 p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm uppercase tracking-wider text-white/60">
            Players ({count})
          </span>
          {!canStart && (
            <span className="text-xs text-white/50">
              need at least {MIN_PLAYERS}
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-ink/50 px-3 py-2"
            >
              <span>
                {p.name}{" "}
                {p.id === state.you.id && (
                  <span className="text-gold/80">(you)</span>
                )}
                {p.id === state.hostId && (
                  <span className="ml-2 text-xs uppercase tracking-wider text-gold/70">
                    host
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            disabled={!canStart || busy}
            onClick={async () => {
              setBusy(true);
              setErr(null);
              try {
                await onStart();
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Failed to start");
              } finally {
                setBusy(false);
              }
            }}
            className="mt-6 w-full rounded-xl bg-crimson py-3 font-semibold uppercase tracking-wider text-white transition hover:bg-crimson/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Starting…" : "Start game"}
          </button>
        ) : (
          <p className="mt-6 text-center text-sm text-white/60">
            Waiting for host to start…
          </p>
        )}
        {err && (
          <p className="mt-3 text-center text-sm text-crimson">{err}</p>
        )}
      </div>
    </div>
  );
}
