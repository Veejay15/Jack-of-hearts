"use client";

import Countdown from "./Countdown";
import type { ClientGameState } from "@/lib/types";

export default function EliminatedScreen({
  state,
  onTimerZero,
}: {
  state: ClientGameState;
  onTimerZero: () => void;
}) {
  const survivors = state.players.filter((p) => p.alive);
  const phaseLabel =
    state.phase === "discussion"
      ? "Discussion phase"
      : state.phase === "guess"
        ? "Guess phase"
        : "Round in progress";

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <div className="rounded-3xl border-2 border-crimson/60 bg-crimson/15 px-10 py-12 shadow-[0_0_60px_rgba(192,38,58,0.25)]">
        <div className="text-sm uppercase tracking-[0.4em] text-crimson">
          Out
        </div>
        <h1 className="mt-3 font-display text-6xl font-bold text-crimson">
          Eliminated
        </h1>
        <p className="mt-4 text-lg text-white/80">
          You guessed wrong. You can no longer whisper or guess this game.
        </p>
        <p className="mt-2 text-sm text-white/60">
          Watch the survivors fight it out — the game ends when the Jack is
          unmasked or everyone else is gone.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-velvet/40 px-6 py-5">
        <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
          {phaseLabel} ends in
        </div>
        <div className="mt-1 text-4xl font-bold tabular-nums">
          <Countdown endsAt={state.phaseEndsAt} onZero={onTimerZero} />
        </div>
      </div>

      <div className="mt-8 w-full rounded-2xl border border-white/10 bg-velvet/40 p-5 text-left">
        <h2 className="text-xs uppercase tracking-[0.25em] text-gold/80">
          Still in the game
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {survivors.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-white/10 bg-ink/40 px-3 py-2 text-sm"
            >
              {p.name}
            </li>
          ))}
          {survivors.length === 0 && (
            <li className="col-span-full italic text-white/40">
              No one is alive.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
