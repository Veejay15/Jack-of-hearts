"use client";

import Avatar from "./Avatar";
import Countdown from "./Countdown";
import SuitIcon from "./SuitIcon";
import type { ClientGameState } from "@/lib/types";

export default function ResultScreen({
  state,
  onTimerZero,
}: {
  state: ClientGameState;
  onTimerZero: () => void;
}) {
  const last = state.history[state.history.length - 1];
  return (
    <div className="mx-auto max-w-4xl">
      <header className="rounded-2xl border border-white/10 bg-velvet/60 px-8 py-6 text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-gold/80">
          Round {last?.round ?? state.roundNumber} · Result
        </div>
        <div className="mt-2 text-base text-white/70">
          Next round in{" "}
          <span className="font-mono text-xl text-white">
            <Countdown endsAt={state.phaseEndsAt} onZero={onTimerZero} />
          </span>
        </div>
      </header>

      <ul className="mt-8 space-y-4">
        {(last?.outcomes ?? []).map((o) => {
          const player = state.players.find((p) => p.id === o.playerId);
          return (
          <li
            key={o.playerId}
            className={`flex items-center justify-between rounded-2xl border px-6 py-5 ${
              o.survived
                ? "border-emerald-400/40 bg-emerald-400/10"
                : "border-crimson/40 bg-crimson/10"
            }`}
          >
            <span className="flex items-center gap-3 text-xl font-semibold">
              {player && (
                <Avatar
                  seed={player.avatarSeed}
                  size={56}
                  dead={!o.survived}
                />
              )}
              <span>{o.name}</span>
            </span>
            <span className="flex items-center gap-5">
              <span className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider text-white/50">
                  Actual
                </span>
                <span className="text-4xl">
                  <SuitIcon suit={o.actualSuit} />
                </span>
              </span>
              <span className="text-2xl text-white/40">→</span>
              <span className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider text-white/50">
                  Guessed
                </span>
                <span className="text-4xl">
                  {o.guess ? (
                    <SuitIcon suit={o.guess} />
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </span>
              </span>
              <span
                className={`ml-4 min-w-[7rem] text-right text-sm font-bold uppercase tracking-wider ${
                  o.survived ? "text-emerald-300" : "text-crimson"
                }`}
              >
                {o.survived ? "Survived" : "Eliminated"}
              </span>
            </span>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
