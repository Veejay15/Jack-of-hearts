import type { Suit } from "@/lib/types";

const GLYPHS: Record<Suit, string> = {
  spade: "♠",
  club: "♣",
  diamond: "♦",
  heart: "♥",
};

const COLORS: Record<Suit, string> = {
  spade: "text-white",
  club: "text-white",
  diamond: "text-crimson",
  heart: "text-crimson",
};

export function suitGlyph(suit: Suit): string {
  return GLYPHS[suit];
}

export default function SuitIcon({
  suit,
  className = "",
}: {
  suit: Suit;
  className?: string;
}) {
  return (
    <span className={`${COLORS[suit]} ${className}`}>{GLYPHS[suit]}</span>
  );
}
