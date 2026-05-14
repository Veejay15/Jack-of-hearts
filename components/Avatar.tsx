"use client";

/**
 * DiceBear-hosted SVG avatar.
 * Style: "lorelei" — anime/manga-style hand-drawn portraits with diverse
 * hair / eyes / expressions. Background palette is moody slate/charcoal/
 * crimson to match the dystopian Alice-in-Borderland vibe rather than the
 * default pastel.
 *
 * The URL is deterministic per seed so the browser caches each avatar.
 */
export default function Avatar({
  seed,
  size = 96,
  dead = false,
  className = "",
}: {
  seed: string;
  size?: number;
  dead?: boolean;
  className?: string;
}) {
  // Darker, more cinematic background colors — slate, charcoal, deep crimson,
  // muted teal — so the portraits read as characters under harsh game-arena
  // lighting rather than friendly stickers.
  const src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=1f2937,334155,4c1d24,1e3a8a,365314,4a044e&radius=50`;

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      {}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="select-none rounded-full bg-white/5"
        style={{
          width: size,
          height: size,
          filter: dead ? "grayscale(100%) brightness(0.55)" : undefined,
          opacity: dead ? 0.55 : 1,
          transform: dead ? "rotate(-8deg)" : undefined,
          transition: "filter 0.4s ease, opacity 0.4s ease, transform 0.4s ease",
        }}
      />
      {dead && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded bg-crimson/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg"
        >
          Out
        </div>
      )}
    </div>
  );
}
