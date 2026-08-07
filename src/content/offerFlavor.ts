import type { TeamDefinition } from "@/content/teams";

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Sueldo puramente cosmético para las cards de oferta — no hay economía real
 * en el juego, es solo flavor. Determinístico por equipo (no cambia en cada
 * render) y escala con baseStrength para que los clubes grandes se sientan grandes.
 */
export function getFictionalOffer(team: TeamDefinition): { monthlyK: number; years: number } {
  const hash = hashSeed(team.id);
  const monthlyK = 8 + team.baseStrength * 14 + (hash % 20);
  const years = 1 + (hash % 3);
  return { monthlyK, years };
}
