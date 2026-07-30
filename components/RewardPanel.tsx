"use client";

import { useMemo, useState } from "react";
import Avatar from "./Avatar";
import { REWARD_CATEGORIES } from "@/lib/questions";
import type { ClientGameState } from "@/lib/types";

/**
 * Post-game forfeit. Jack won → the Jack picks a distinct question for
 * every loser to answer on the call. Players won → every surviving winner
 * picks a distinct question for the Jack.
 */
export default function RewardPanel({
  state,
  onReward,
}: {
  state: ClientGameState;
  onReward: (
    category: string,
    question: string,
    targetId?: string,
  ) => Promise<void>;
}) {
  const [categoryId, setCategoryId] = useState(REWARD_CATEGORIES[0].id);
  const [question, setQuestion] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rewards = state.rewards ?? [];
  const you = state.you;
  const jackWon = state.winner === "jack";
  const jack = state.players.find((p) => p.id === state.jackId);
  const losers = state.players.filter((p) => p.id !== state.jackId);
  const winners = useMemo(
    () => state.players.filter((p) => p.alive && p.id !== state.jackId),
    [state.players, state.jackId],
  );

  const alreadyAsked = rewards.some((r) => r.askerId === you.id);
  const expectedAsks = jackWon ? losers.length : winners.length;
  const canAsk = jackWon
    ? you.isJack && rewards.length < expectedAsks
    : !you.isJack && you.alive && !alreadyAsked;
  const usedQuestions = new Set(rewards.map((r) => r.question));
  const category =
    REWARD_CATEGORIES.find((c) => c.id === categoryId) ?? REWARD_CATEGORIES[0];

  const nameOf = (id: string) =>
    state.players.find((p) => p.id === id)?.name ?? "?";

  const myForfeits = rewards.filter((r) => r.targetId === you.id);

  const submit = async () => {
    if (!question || busy) return;
    if (jackWon && !targetId) return;
    setBusy(true);
    setError(null);
    try {
      await onReward(categoryId, question, jackWon ? targetId! : undefined);
      setQuestion(null);
      setTargetId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send question");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-gold/30 bg-velvet/40 p-8 text-left">
      <h2 className="text-base uppercase tracking-[0.25em] text-gold/80">
        {jackWon ? "The Jack's reward" : "The winners' reward"}
      </h2>
      <p className="mt-2 text-sm text-white/70">
        {jackWon
          ? `${jack?.name ?? "The Jack"} picks a different question for every loser — each of you answers yours live on the call.`
          : `Each surviving winner picks a different question for ${jack?.name ?? "the Jack"} to answer live on the call.`}
      </p>

      {/* Your forfeit, front and center */}
      {myForfeits.map((r) => (
        <div
          key={r.question}
          className="mt-6 rounded-2xl border border-crimson/50 bg-crimson/10 p-6"
        >
          <div className="text-xs uppercase tracking-[0.3em] text-crimson">
            Your forfeit — answer on the call
          </div>
          <p className="mt-2 font-display text-2xl">{r.question}</p>
          <p className="mt-2 text-sm text-white/60">
            asked by <span className="text-gold">{nameOf(r.askerId)}</span>
          </p>
        </div>
      ))}

      {/* Picker for whoever gets to ask */}
      {canAsk && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {REWARD_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategoryId(c.id);
                  setQuestion(null);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  c.id === categoryId
                    ? "border-gold bg-gold/20 text-gold"
                    : "border-white/15 bg-ink/40 text-white/70 hover:border-gold/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/50">{category.blurb}</p>

          <ul className="mt-4 space-y-2">
            {category.questions.map((q) => {
              const taken = usedQuestions.has(q);
              return (
                <li key={q}>
                  <button
                    disabled={taken}
                    onClick={() => setQuestion(q)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      question === q
                        ? "border-gold bg-gold/15 text-gold"
                        : taken
                          ? "cursor-not-allowed border-white/5 bg-ink/20 text-white/30 line-through"
                          : "border-white/10 bg-ink/40 text-white/85 hover:border-gold/50"
                    }`}
                  >
                    {q}
                    {taken && (
                      <span className="ml-2 text-xs uppercase tracking-wider no-underline">
                        taken
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {jackWon && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.3em] text-gold/80">
                Who has to answer it?
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {losers.map((p) => {
                  const assigned = rewards.some((r) => r.targetId === p.id);
                  return (
                    <button
                      key={p.id}
                      disabled={assigned}
                      onClick={() => setTargetId(p.id)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition ${
                        targetId === p.id
                          ? "border-gold bg-gold/15 text-gold"
                          : assigned
                            ? "cursor-not-allowed border-white/5 bg-ink/20 text-white/30"
                            : "border-white/10 bg-ink/40 text-white/85 hover:border-gold/50"
                      }`}
                    >
                      <Avatar seed={p.avatarSeed} size={28} />
                      <span className="text-sm font-medium">{p.name}</span>
                      {assigned && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!question || (jackWon && !targetId) || busy}
            className="mt-6 rounded-xl bg-crimson px-6 py-2.5 font-semibold uppercase tracking-wider text-white transition hover:bg-crimson/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Sending…" : "Lock in question"}
          </button>
          {error && <p className="mt-3 text-sm text-crimson">{error}</p>}
        </div>
      )}

      {/* Everyone sees the assignments as they land */}
      {rewards.length > 0 && (
        <ul className="mt-6 space-y-2">
          {rewards.map((r) => (
            <li
              key={`${r.askerId}-${r.question}`}
              className="rounded-xl bg-ink/40 px-4 py-3 text-sm"
            >
              <span className="font-semibold text-gold">
                {nameOf(r.askerId)}
              </span>{" "}
              asks{" "}
              <span className="font-semibold text-crimson">
                {nameOf(r.targetId)}
              </span>
              : <span className="text-white/85">{r.question}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Waiting states */}
      {rewards.length < expectedAsks && !canAsk && (
        <p className="mt-6 text-sm text-white/60">
          {jackWon
            ? `Waiting for ${jack?.name ?? "the Jack"} to pick questions… (${rewards.length}/${expectedAsks})`
            : `Waiting for the winners to pick questions… (${rewards.length}/${expectedAsks})`}
        </p>
      )}
      {rewards.length >= expectedAsks && expectedAsks > 0 && (
        <p className="mt-6 text-sm text-emerald-300">
          All questions are in — answer them on the call!
        </p>
      )}
    </section>
  );
}
