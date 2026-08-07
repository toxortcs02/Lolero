/**
 * Apodos random para el jugador, estilo chiste interno de comunidad esports.
 * Placeholder — reemplazar por los chistes internos reales de tu comunidad.
 */
export const APODOS = [
  "El Inting Reborn",
  "Baron Stealer",
  "Flash Bot",
  "El Rey del Int",
  "Manos de Trapo",
  "Farmero Profesional",
  "El Ragequit",
  "El Fed",
  "Buff del Rival",
  "El Que Se Cuelga",
  "Bronce Disfrazado",
  "Ward Simulator",
  "El Toxic Bueno",
  "Carry de Discord",
  "El Último Pick",
] as const;

/** Determinístico por seed (ej. el nick del personaje) para que no cambie en cada render. */
export function getApodo(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return APODOS[hash % APODOS.length];
}
