/** Rangos de LoL, de Hierro a Retador, mapeados 1:1 sobre el 0-100 de fanatismo. */
export const LOL_RANKS = [
  "Hierro",
  "Bronce",
  "Plata",
  "Oro",
  "Platino",
  "Esmeralda",
  "Diamante",
  "Maestro",
  "Gran Maestro",
  "Retador",
] as const;

export function getLolRank(value: number): string {
  const idx = Math.min(LOL_RANKS.length - 1, Math.max(0, Math.floor(value / 10)));
  return LOL_RANKS[idx];
}

type Rgb = [number, number, number];

const RED: Rgb = [220, 38, 38]; // 0
const GREEN: Rgb = [34, 197, 94]; // 50
const GOLD: Rgb = [200, 170, 110]; // 100

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

/** Color de la barra: rojo (0) -> verde (50) -> dorado (100). */
export function getBarColor(value: number): string {
  const v = Math.min(100, Math.max(0, value));
  const [from, to, base] = v <= 50 ? [RED, GREEN, 0] : [GREEN, GOLD, 50];
  const t = (v - base) / 50;
  const [r, g, b] = [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
  return `rgb(${r}, ${g}, ${b})`;
}
