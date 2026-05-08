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

  useEffect(() => {
    if (remaining <= 0 && onZero) onZero();
    // intentionally only when remaining transitions through 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="font-mono tabular-nums">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}
