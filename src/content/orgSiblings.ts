/** Academy (Challengers) team id -> su equipo principal de LCK (misma organización). */
export const ACADEMY_TO_LCK: Record<string, string> = {
  "t1-a": "t1",
  "gen-ga": "gen-g",
  "hle-c": "hle",
  "kt-c": "kt",
  "dplus-c": "dplus",
  "drx-c": "drx",
  "ns-c": "ns",
  "brion-c": "brion",
  "soop-c": "soop",
  "fearx-y": "fearx",
};

export function getLckSiblingId(academyId: string): string | undefined {
  return ACADEMY_TO_LCK[academyId];
}
