"use client";

import Pusher, { type Channel } from "pusher-js";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DiscussionRound from "@/components/DiscussionRound";
import EliminatedScreen from "@/components/EliminatedScreen";
import GameOver from "@/components/GameOver";
import GuessPhase from "@/components/GuessPhase";
import Lobby from "@/components/Lobby";
import ResultScreen from "@/components/ResultScreen";
import type { ClientGameState, Suit } from "@/lib/types";

type Stored = { playerId: string; token: string };

function loadStored(code: string): Stored | null {
  try {
    const raw = sessionStorage.getItem(`joh:${code}`);
    if (!raw) return null;
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params?.code ?? "").toUpperCase();

  const [stored, setStored] = useState<Stored | null>(null);
  const [state, setState] = useState<ClientGameState | null>(null);
  const [recs, setRecs] = useState<Record<string, Suit>>({});
  const [error, setError] = useState<string | null>(null);
  const advancingRef = useRef(false);

  // Hydrate stored creds on mount; if missing, send back to landing.
  useEffect(() => {
    const s = loadStored(code);
    if (!s) {
      router.replace(`/?missing=${code}`);
      return;
    }
    setStored(s);
  }, [code, router]);

  const authedFetch = useCallback(
    (url: string, init: RequestInit = {}) => {
      if (!stored) throw new Error("Not authenticated");
      return fetch(url, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          authorization: `Bearer ${stored.token}`,
        },
      });
    },
    [stored],
  );

  // Pull the latest state snapshot.
  const refresh = useCallback(async () => {
    if (!stored) return;
    const res = await authedFetch(`/api/rooms/${code}/state`);
    if (!res.ok) {
      setError((await res.json()).error ?? `Error ${res.status}`);
      return;
    }
    const { state: next, recommendations } = (await res.json()) as {
      state: ClientGameState;
      recommendations: Record<string, Suit>;
    };
    setState(next);
    setRecs(recommendations ?? {});
  }, [authedFetch, code, stored]);

  // Subscribe to Pusher channels and refresh on every relevant event.
  useEffect(() => {
    if (!stored) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      setError("Pusher env vars missing");
      return;
    }

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      auth: { params: { token: stored.token } },
    });

    const roomCh: Channel = pusher.subscribe(`private-room-${code}`);
    const playerCh: Channel = pusher.subscribe(
      `private-player-${stored.playerId}`,
    );

    const onAny = () => refresh();
    roomCh.bind("room-updated", onAny);
    roomCh.bind("round-started", onAny);
    roomCh.bind("phase-changed", onAny);
    roomCh.bind("round-result", onAny);
    roomCh.bind("game-over", onAny);

    playerCh.bind(
      "recommendation",
      (data: { senderId: string; suit: Suit }) => {
        setRecs((prev) => ({ ...prev, [data.senderId]: data.suit }));
      },
    );

    refresh();

    // Safety net: poll state every 4s in case a Pusher event is dropped
    // (browser background-tab throttling, network blip, etc.).
    const pollId = setInterval(() => {
      refresh();
    }, 4000);

    // Re-sync immediately when the tab comes back to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisible);
      pusher.unsubscribe(`private-room-${code}`);
      pusher.unsubscribe(`private-player-${stored.playerId}`);
      pusher.disconnect();
    };
  }, [code, refresh, stored]);

  const callAdvance = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      await authedFetch(`/api/rooms/${code}/advance`, { method: "POST" });
      await refresh();
    } finally {
      advancingRef.current = false;
    }
  }, [authedFetch, code, refresh]);

  const onStart = useCallback(async () => {
    const res = await authedFetch(`/api/rooms/${code}/start`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error((await res.json()).error ?? "Failed to start");
    }
    await refresh();
  }, [authedFetch, code, refresh]);

  const onRecommend = useCallback(
    async (targetId: string, suit: Suit) => {
      const res = await authedFetch(`/api/rooms/${code}/recommend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId, suit }),
      });
      if (!res.ok) throw new Error("Failed to send recommendation");
    },
    [authedFetch, code],
  );

  const onGuess = useCallback(
    async (suit: Suit) => {
      const res = await authedFetch(`/api/rooms/${code}/guess`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ suit }),
      });
      if (!res.ok) throw new Error("Failed to lock in guess");
    },
    [authedFetch, code],
  );

  const onPlayAgain = useCallback(async () => {
    const res = await authedFetch(`/api/rooms/${code}/reset`, {
      method: "POST",
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to reset");
      return;
    }
    await refresh();
  }, [authedFetch, code, refresh]);

  const isHost = useMemo(
    () => Boolean(state && stored && state.hostId === stored.playerId),
    [state, stored],
  );

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-2xl border border-crimson/40 bg-crimson/10 p-6 text-center">
          <p className="text-crimson">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-velvet px-4 py-2 text-sm"
          >
            Back to start
          </button>
        </div>
      </main>
    );
  }

  if (!state || !stored) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-white/60">Connecting…</p>
      </main>
    );
  }

  const eliminatedDuringActivePhase =
    !state.you.alive &&
    (state.phase === "discussion" || state.phase === "guess");

  return (
    <main className="px-6 py-10">
      {state.phase === "lobby" && (
        <Lobby state={state} isHost={isHost} onStart={onStart} />
      )}
      {eliminatedDuringActivePhase && (
        <EliminatedScreen state={state} onTimerZero={callAdvance} />
      )}
      {state.phase === "discussion" && state.you.alive && (
        <DiscussionRound
          state={state}
          recommendations={recs}
          onRecommend={onRecommend}
          onTimerZero={callAdvance}
        />
      )}
      {state.phase === "guess" && state.you.alive && (
        <GuessPhase
          state={state}
          recommendations={recs}
          onGuess={onGuess}
          onTimerZero={callAdvance}
        />
      )}
      {state.phase === "result" && (
        <ResultScreen state={state} onTimerZero={callAdvance} />
      )}
      {state.phase === "game-over" && (
        <GameOver state={state} isHost={isHost} onPlayAgain={onPlayAgain} />
      )}
    </main>
  );
}
