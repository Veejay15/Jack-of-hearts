"use client";

import Avatar from "./Avatar";
import RewardPanel from "./RewardPanel";
import SuitIcon from "./SuitIcon";
import type { ClientGameState } from "@/lib/types";

export default function GameOver({
  state,
  isHost,
  onPlayAgain,
  onReward,
}: {
  state: ClientGameState;
  isHost: boolean;
  onPlayAgain: () => void;
  onReward: (
    category: string,
    question: string,
    targetId?: string,
  ) => Promise<void>;
}) {
  const jack = state.players.find((p) => p.id === state.jackId);
  const playersWon = state.winner === "players";

  const bannerBorder = playersWon
    ? "border-emerald-400/40 bg-emerald-400/10"
    : "border-crimson/40 bg-crimson/10";

  const bannerTitle = playersWon ? "Players win" : "The Jack wins";

  // If the Jack won while non-Jack players were still alive at the round
  // cap, surface the "outlasted" framing so the result reads as intentional
  // rather than a bug.
  const jackOutlasted =
    !playersWon &&
    state.players.some((p) => p.alive && p.id !== state.jackId);

  return (
    <div className="mx-auto max-w-5xl text-center">
      <div className={`rounded-3xl border p-12 ${bannerBorder}`}>
        <div className="text-sm uppercase tracking-[0.4em] text-gold/80">
          Game over
        </div>
        <h1 className="mt-4 text-6xl font-display font-bold">{bannerTitle}</h1>
        {jackOutlasted && (
          <p className="mt-4 text-lg text-white/80">
            The round budget ran out and the Jack of Hearts was never
            unmasked. The remaining players are considered defeated.
          </p>
        )}
        {jack && (
          <div className="mt-6 flex flex-col items-center">
            <Avatar seed={jack.avatarSeed} size={120} dead={!jack.alive} />
            <p className="mt-3 text-xl text-white/80">
              The Jack of Hearts was{" "}
              <span className="font-bold text-gold">{jack.name}</span>.
            </p>
          </div>
        )}
      </div>

      <RewardPanel state={state} onReward={onReward} />

      <section className="mt-10 rounded-2xl border border-white/10 bg-velvet/40 p-8 text-left">
        <h2 className="text-base uppercase tracking-[0.25em] text-gold/80">
          Round recap
        </h2>
        <ol className="mt-6 space-y-6">
          {state.history.map((h) => (
            <li key={h.round} className="rounded-2xl bg-ink/40 p-6">
              <div className="mb-4 text-sm uppercase tracking-wider text-white/60">
                Round {h.round}
              </div>
              <ul className="divide-y divide-white/10">
                {h.outcomes.map((o) => {
                  const player = state.players.find((p) => p.id === o.playerId);
                  return (
                    <li
                      key={o.playerId}
                      className="flex items-center justify-between py-3 text-lg"
                    >
                      <span className="flex items-center gap-3 font-medium">
                        {player && (
                          <Avatar
                            seed={player.avatarSeed}
                            size={40}
                            dead={!o.survived}
                          />
                        )}
                        <span>{o.name}</span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="text-3xl" title="actual suit">
                          <SuitIcon suit={o.actualSuit} />
                        </span>
                        <span className="text-white/40">→</span>
                        <span className="text-3xl" title="guess">
                          {o.guess ? (
                            <SuitIcon suit={o.guess} />
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </span>
                        <span
                          className={`min-w-[7rem] text-right text-sm font-semibold uppercase tracking-wider ${
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
            </li>
          ))}
        </ol>
      </section>

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="mt-8 rounded-xl bg-crimson px-8 py-3 font-semibold uppercase tracking-wider text-white transition hover:bg-crimson/90"
        >
          Play again
        </button>
      ) : (
        <p className="mt-8 text-sm text-white/60">
          Waiting for the host to start a new game…
        </p>
      )}
    </div>
  );
}
