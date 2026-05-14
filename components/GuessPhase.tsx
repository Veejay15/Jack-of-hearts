"use client";

import { useState } from "react";
import Countdown from "./Countdown";
import RecommendationsInbox from "./RecommendationsInbox";
import { suitGlyph } from "./SuitIcon";
import type { ClientGameState, Suit } from "@/lib/types";
import { SUITS } from "@/lib/types";

export default function GuessPhase({
  state,
  recommendations,
  onGuess,
  onTimerZero,
}: {
  state: ClientGameState;
  recommendations: Record<string, Suit>;
  onGuess: (suit: Suit) => Promise<void>;
  onTimerZero: () => void;
}) {
  const [locked, setLocked] = useState<Suit | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (suit: Suit) => {
    if (locked || busy || !state.you.alive) return;
    setBusy(true);
    try {
      await onGuess(suit);
      setLocked(suit);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col items-center text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
          Round {state.roundNumber} · Guess phase
        </div>
        <div className="mt-2 text-7xl font-bold tabular-nums">
          <Countdown endsAt={state.phaseEndsAt} onZero={onTimerZero} />
        </div>
        <p className="mt-4 max-w-xl text-white/70">
          What suit do you have? Pick one. Wrong guesses are eliminated.
        </p>
        {state.you.isJack && (
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-crimson">
            ♥ You are still the Jack of Hearts.
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col items-center rounded-2xl border border-white/10 bg-velvet/40 p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.3em] text-gold/80">
            Your guess
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {SUITS.map((s) => (
              <button
                key={s}
                disabled={!!locked || busy}
                onClick={() => submit(s)}
                className={`flex h-32 w-32 items-center justify-center rounded-2xl border text-7xl font-display transition ${
                  locked === s
                    ? "border-gold bg-gold/20 text-gold"
                    : "border-white/10 bg-velvet hover:border-gold hover:bg-velvet/80"
                } ${
                  (s === "diamond" || s === "heart") && locked !== s
                    ? "text-crimson"
                    : ""
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {suitGlyph(s)}
              </button>
            ))}
          </div>
          {locked && (
            <p className="mt-6 text-sm text-gold">
              Locked in. Waiting for the round to resolve…
            </p>
          )}
          {!locked && (
            <p className="mt-6 max-w-md text-center text-xs text-white/50">
              Pick a suit before the timer runs out. No pick = eliminated.
            </p>
          )}
        </section>

        <RecommendationsInbox
          recommendations={recommendations}
          state={state}
        />
      </div>
    </div>
  );
}
