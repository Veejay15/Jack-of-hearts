"use client";

import { useState } from "react";
import Avatar from "./Avatar";

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function makeInitialSeed(): string {
  return randomSeed();
}

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (seed: string) => void;
}) {
  // The pool is fixed once for the current shuffle state. It always
  // includes the initial `value` so the starting choice stays on screen,
  // and clicking another avatar only moves the highlight — it never
  // reflows the grid (which was confusing players into picking the
  // wrong slot).
  const [pool, setPool] = useState<string[]>(() => [
    value,
    ...Array.from({ length: 7 }, randomSeed),
  ]);

  const shuffle = () => {
    const next = Array.from({ length: 8 }, randomSeed);
    setPool(next);
    onChange(next[0]);
  };

  const selected = pool.includes(value);

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar seed={value} size={48} />
          <div>
            <div className="text-xs uppercase tracking-wider text-white/60">
              Your character
            </div>
            <div className="text-[10px] text-white/40">
              {selected ? "Looking good." : "Pick one below or shuffle."}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-md border border-white/10 px-2 py-1 text-xs text-gold hover:bg-white/5"
        >
          Shuffle ↻
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {pool.map((seed, i) => (
          <button
            key={`${seed}-${i}`}
            type="button"
            onClick={() => onChange(seed)}
            aria-label="Select avatar"
            aria-pressed={value === seed}
            className={`flex items-center justify-center rounded-xl border-2 p-1 transition ${
              value === seed
                ? "border-gold bg-gold/10 shadow-[0_0_20px_rgba(224,179,92,0.2)]"
                : "border-white/10 bg-ink/40 hover:border-white/30"
            }`}
          >
            <Avatar seed={seed} size={56} />
          </button>
        ))}
      </div>
    </div>
  );
}
