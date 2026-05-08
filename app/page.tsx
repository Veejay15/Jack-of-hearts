"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "create" | "join";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (mode === "create") {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hostName: name }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        const data = await res.json();
        sessionStorage.setItem(
          `joh:${data.code}`,
          JSON.stringify({ playerId: data.playerId, token: data.token }),
        );
        router.push(`/room/${data.code}`);
      } else {
        const upper = code.trim().toUpperCase();
        const res = await fetch(`/api/rooms/${upper}/join`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
        const data = await res.json();
        sessionStorage.setItem(
          `joh:${data.code}`,
          JSON.stringify({ playerId: data.playerId, token: data.token }),
        );
        router.push(`/room/${data.code}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <header className="mb-10 text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-gold/80">
            A social deduction game
          </div>
          <h1 className="mt-3 font-display text-6xl font-bold text-white">
            Jack of <span className="text-crimson">Hearts</span>
          </h1>
          <p className="mt-3 text-white/60">
            Six players. One traitor. Three minutes to figure out your suit.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-velvet/60 p-6 backdrop-blur">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-ink/60 p-1 text-sm">
            <button
              onClick={() => setMode("create")}
              className={`rounded-lg py-2 transition ${
                mode === "create"
                  ? "bg-crimson text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Create room
            </button>
            <button
              onClick={() => setMode("join")}
              className={`rounded-lg py-2 transition ${
                mode === "join"
                  ? "bg-crimson text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Join room
            </button>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-white/60">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink/60 px-3 py-2 outline-none focus:border-gold/60"
              placeholder="e.g. Alex"
            />
          </label>

          {mode === "join" && (
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-wider text-white/60">
                Room code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink/60 px-3 py-2 font-mono uppercase tracking-[0.3em] outline-none focus:border-gold/60"
                placeholder="ABC123"
              />
            </label>
          )}

          <button
            disabled={busy || !name.trim() || (mode === "join" && code.length !== 6)}
            onClick={submit}
            className="mt-6 w-full rounded-xl bg-crimson py-3 font-semibold uppercase tracking-wider text-white transition hover:bg-crimson/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? "Working…"
              : mode === "create"
                ? "Create room"
                : "Join room"}
          </button>

          {err && <p className="mt-3 text-center text-sm text-crimson">{err}</p>}
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          Open six tabs, get on a Zoom, and try not to trust each other.
        </p>
      </div>
    </main>
  );
}
