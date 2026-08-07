/**
 * Fixed historic rival per team (bidirectional, one rival each). T1/Gen.G
 * and DRX/Dplus were explicitly requested; the other three pairs are my
 * own reasonable fill-in — adjust freely.
 */
export const RIVAL_PAIRS: Record<string, string> = {
  "t1-a": "gen-ga",
  "gen-ga": "t1-a",
  "drx-c": "dplus-c",
  "dplus-c": "drx-c",
  "kt-c": "hle-c",
  "hle-c": "kt-c",
  "ns-c": "soop-c",
  "soop-c": "ns-c",
  "brion-c": "fearx-y",
  "fearx-y": "brion-c",
};

export function getRivalTeamId(teamId: string): string | undefined {
  return RIVAL_PAIRS[teamId];
}
