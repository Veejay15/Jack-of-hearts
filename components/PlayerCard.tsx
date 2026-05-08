"use client";

import SuitIcon from "./SuitIcon";
import type { Suit } from "@/lib/types";

export default function PlayerCard({
  name,
  suit,
  alive,
  isYou,
  highlight,
}: {
  name: string;
  suit: Suit | null;
  alive: boolean;
  isYou: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border bg-velvet/70 px-4 py-3 transition ${
        alive
          ? highlight
            ? "border-gold/80 shadow-[0_0_20px_rgba(224,179,92,0.25)]"
            : "border-white/10"
          : "border-white/5 opacity-40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="truncate text-sm font-medium">
          {name} {isYou && <span className="text-gold/80">(you)</span>}
        </span>
        {!alive && (
          <span className="text-xs uppercase tracking-wider text-crimson">
            eliminated
          </span>
        )}
      </div>
      <div className="mt-2 flex h-16 items-center justify-center rounded-lg bg-ink/60 text-5xl font-display">
        {suit ? <SuitIcon suit={suit} /> : <span className="text-white/30">?</span>}
      </div>
    </div>
  );
}
