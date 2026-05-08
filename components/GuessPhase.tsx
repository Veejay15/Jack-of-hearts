"use client";

import { useState } from "react";
import Countdown from "./Countdown";
import { suitGlyph } from "./SuitIcon";
import type { ClientGameState, Suit } from "@/lib/types";
import { SUITS } from "@/lib/types";

export default function GuessPhase({
  state,
  onGuess,
  onTimerZero,
}: {
  state: ClientGameState;
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
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
        Guess phase
      </div>
      <div className="mt-2 text-7xl font-bold tabular-nums">
        <Countdown endsAt={state.phaseEndsAt} onZero={onTimerZero} />
      </div>
      <p className="mt-4 max-w-md text-white/70">
        What suit do you have? Pick one. Wrong guesses are eliminated.
      </p>
      {state.you.isJack && (
        <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-crimson">
          ♥ You are still the Jack of Hearts.
        </p>
      )}
      {!state.you.alive ? (
        <p className="mt-8 text-crimson">
          You were eliminated. Watch the survivors.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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
      )}
      {locked && (
        <p className="mt-6 text-sm text-gold">
          Locked in. Waiting for the round to resolve…
        </p>
      )}
    </div>
  );
}
