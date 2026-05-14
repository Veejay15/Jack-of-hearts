"use client";

import { useEffect, useState } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-ink/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <a href="/" className="font-display text-xl font-bold tracking-wide">
            Jack of <span className="text-crimson">Hearts</span>
          </a>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-white/15 bg-velvet/60 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-white/80 transition hover:border-gold/60 hover:text-gold"
          >
            How to play
          </button>
        </div>
      </nav>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-velvet p-8 shadow-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
            <h2 className="font-display text-3xl font-bold">
              How to play <span className="text-crimson">Jack of Hearts</span>
            </h2>
            <p className="mt-2 text-sm uppercase tracking-[0.25em] text-gold/80">
              A 4–8 player social deduction game
            </p>

            <section className="mt-6 space-y-5 text-white/85">
              <div>
                <h3 className="font-display text-lg font-semibold text-gold">
                  The setup
                </h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    Every player is dealt a hidden suit
                    (<span className="text-white">♠ ♣</span>{" "}
                    <span className="text-crimson">♦ ♥</span>) — only the others
                    can see it; you cannot see your own.
                  </li>
                  <li>
                    One random player is secretly the{" "}
                    <span className="text-crimson font-semibold">
                      Jack of Hearts
                    </span>
                    . They get a private banner telling them their role.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-gold">
                  Each round (1 min discussion + 1 min guess)
                </h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    During the 1-minute discussion, send a private suit
                    suggestion to any other player using the buttons under their
                    card. Only the recipient sees it.
                  </li>
                  <li>
                    You can update your recommendation at any time. Watch your
                    inbox for what others are telling you.
                  </li>
                  <li>
                    When the guess phase begins, you have 60 seconds to pick
                    your own suit.
                  </li>
                  <li>
                    Wrong guess →{" "}
                    <span className="text-crimson font-semibold">
                      eliminated
                    </span>
                    . Correct guess → you survive into the next round.
                  </li>
                  <li>
                    Survivors get fresh random suits every round. The Jack stays
                    the Jack.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-gold">
                  Win conditions
                </h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    <span className="text-emerald-300 font-semibold">
                      Players win
                    </span>{" "}
                    if the Jack is eliminated (guesses wrong).
                  </li>
                  <li>
                    <span className="text-crimson font-semibold">
                      The Jack wins
                    </span>{" "}
                    if everyone else is eliminated.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-gold">
                  If you're the Jack
                </h3>
                <p className="mt-1 text-sm">
                  Your job is to lie. Send the wrong suit to other players to
                  confuse them. But you also can't see your own suit, so you
                  still have to deduce it from honest players' recommendations
                  to survive.
                </p>
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold text-gold">
                  Tip
                </h3>
                <p className="mt-1 text-sm">
                  Get on a Zoom or Discord call together while you play. Trash
                  talk is part of the game.
                </p>
              </div>
            </section>

            <button
              onClick={() => setOpen(false)}
              className="mt-8 w-full rounded-xl bg-crimson py-3 font-semibold uppercase tracking-wider text-white transition hover:bg-crimson/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
