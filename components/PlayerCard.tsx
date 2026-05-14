"use client";

import Avatar from "./Avatar";
import SuitIcon from "./SuitIcon";
import type { Suit } from "@/lib/types";

export default function PlayerCard({
  name,
  avatarSeed,
  suit,
  alive,
  isYou,
  highlight,
}: {
  name: string;
  avatarSeed: string;
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
          : "border-crimson/40 opacity-80"
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar seed={avatarSeed} size={56} dead={!alive} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {name}{" "}
            {isYou && <span className="text-gold/80">(you)</span>}
          </div>
          {!alive ? (
            <div className="mt-0.5 text-xs uppercase tracking-wider text-crimson">
              Eliminated
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-white/40">In play</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex h-16 items-center justify-center rounded-lg bg-ink/60 text-5xl font-display">
        {suit ? <SuitIcon suit={suit} /> : <span className="text-white/30">?</span>}
      </div>
    </div>
  );
}
