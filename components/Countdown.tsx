"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  endsAt,
  onZero,
}: {
  endsAt: number;
  onZero?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endsAt - now);
  const seconds = Math.ceil(remaining / 1000);
  const expired = remaining <= 0;

  useEffect(() => {
    if (!expired || !onZero) return;
    // Fire immediately, then keep retrying every 2s. The server may reject
    // the advance until its own clock crosses phaseEndsAt (we may be ahead),
    // and the parent will unmount/remount this component once the phase
    // actually changes, which clears the interval.
    onZero();
    const id = setInterval(() => onZero(), 2000);
    return () => clearInterval(id);
  }, [expired, onZero]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="font-mono tabular-nums">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}
