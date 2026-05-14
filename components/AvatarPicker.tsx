"use client";

import { useMemo, useState } from "react";
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
  const [pool, setPool] = useState<string[]>(() =>
    Array.from({ length: 8 }, randomSeed),
  );

  // Always include the currently selected seed in the display so the
  // user's pick stays visible even after shuffles.
  const display = useMemo(() => {
    if (pool.includes(value)) return pool;
    return [value, ...pool.slice(0, 7)];
  }, [pool, value]);

  const shuffle = () => {
    const next = Array.from({ length: 8 }, randomSeed);
    setPool(next);
    onChange(next[0]);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/60">
          Pick your character
        </span>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-md px-2 py-1 text-xs text-gold hover:bg-white/5"
        >
          Shuffle ↻
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {display.map((seed) => (
          <button
            key={seed}
            type="button"
            onClick={() => onChange(seed)}
            aria-label="Select avatar"
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
