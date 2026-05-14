"use client";

import { useState } from "react";
import Countdown from "./Countdown";
import PlayerCard from "./PlayerCard";
import RecommendationsInbox from "./RecommendationsInbox";
import { suitGlyph } from "./SuitIcon";
import type { ClientGameState, Suit } from "@/lib/types";
import { SUITS, maxRoundsFor } from "@/lib/types";

export default function DiscussionRound({
  state,
  recommendations,
  onRecommend,
  onTimerZero,
}: {
  state: ClientGameState;
  recommendations: Record<string, Suit>;
  onRecommend: (targetId: string, suit: Suit) => Promise<void>;
  onTimerZero: () => void;
}) {
  // sender's outgoing recs (local-only echo so the UI feels instant)
  const [sent, setSent] = useState<Record<string, Suit>>({});
  const others = state.players.filter(
    (p) => p.id !== state.you.id && p.alive,
  );

  const send = async (targetId: string, suit: Suit) => {
    setSent((prev) => ({ ...prev, [targetId]: suit }));
    try {
      await onRecommend(targetId, suit);
    } catch {
      setSent((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-velvet/60 px-5 py-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
            Round {state.roundNumber} / {maxRoundsFor(state.players.length)} · Discussion
          </div>
          <div className="text-sm text-white/60">
            Whisper a suit to anyone. Choose wisely — one of you is lying.
          </div>
        </div>
        <div className="text-3xl font-bold">
          <Countdown endsAt={state.phaseEndsAt} onZero={onTimerZero} />
        </div>
      </header>

      {state.you.isJack && (
        <div className="rounded-2xl border-2 border-crimson bg-crimson/15 px-5 py-4 shadow-[0_0_30px_rgba(192,38,58,0.25)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-crimson">
                Secret role
              </div>
              <div className="mt-1 font-display text-2xl font-bold">
                You are the <span className="text-crimson">Jack of Hearts</span>
              </div>
              <div className="mt-1 text-sm text-white/80">
                Lie to other players about their suits. Eliminate everyone else
                to win — but you also need to guess your own suit each round, so
                listen carefully too.
              </div>
            </div>
            <div className="text-6xl">♥</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-velvet/40 p-4">
            <div className="mb-3 text-xs uppercase tracking-wider text-white/60">
              Your card
            </div>
            <div className="mx-auto max-w-sm">
              <PlayerCard
                name={state.you.name}
                avatarSeed={state.you.avatarSeed}
                suit={null}
                alive={state.you.alive}
                isYou
              />
              <p className="mt-2 text-center text-xs text-white/50">
                You can't see your own suit. Survive by deducing it.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-velvet/40 p-4">
            <div className="mb-3 text-xs uppercase tracking-wider text-white/60">
              Other players
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {others.map((p) => {
                const mySent = sent[p.id];
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-white/10 bg-ink/40 p-3"
                  >
                    <PlayerCard
                      name={p.name}
                      avatarSeed={p.avatarSeed}
                      suit={p.suit ?? null}
                      alive={p.alive}
                      isYou={false}
                    />
                    <div className="mt-3">
                      <div className="mb-1 text-[11px] uppercase tracking-wider text-white/50">
                        Tell them their suit is…
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {SUITS.map((s) => (
                          <button
                            key={s}
                            onClick={() => send(p.id, s)}
                            className={`rounded-md px-2 py-2 text-xl transition ${
                              mySent === s
                                ? "bg-gold text-ink"
                                : "bg-velvet/80 hover:bg-velvet"
                            } ${
                              s === "diamond" || s === "heart"
                                ? mySent === s
                                  ? ""
                                  : "text-crimson"
                                : ""
                            }`}
                            aria-label={`Tell ${p.name} their suit is ${s}`}
                          >
                            {suitGlyph(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <RecommendationsInbox
          recommendations={recommendations}
          state={state}
        />
      </div>
    </div>
  );
}
