export type PlayoffStage = "no_qualified" | "quarterfinals" | "semifinals" | "final" | "champion";

export const PLAYOFF_STAGE_LABELS: Record<PlayoffStage, string> = {
  no_qualified: "No clasificaste a playoffs",
  quarterfinals: "Eliminado en Cuartos de Final",
  semifinals: "Eliminado en Semifinales",
  final: "Subcampeón (perdiste la Final)",
  champion: "Campeón de liga",
};

/** Top N of the standings make playoffs — LCK-style (6 of 10). */
const PLAYOFF_SPOTS = 6;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Cosmetic playoff bracket run, seeded off the regular-season standing
 * position plus the same overall/team-strength factors as match sim.
 * standingPosition is 1-indexed (1 = first place).
 */
export function simulatePlayoffs(
  standingPosition: number,
  overall: number,
  teamStrength: number,
): PlayoffStage {
  if (standingPosition > PLAYOFF_SPOTS || standingPosition < 1) return "no_qualified";

  const seedBonus = (PLAYOFF_SPOTS - standingPosition) * 0.02; // better seed, easier road
  const strengthFactor = (teamStrength - 5.5) / 10;
  const overallFactor = (overall - 50) / 200;
  const advanceChance = clamp(0.5 + strengthFactor + overallFactor + seedBonus, 0.15, 0.85);

  let stage: PlayoffStage = "quarterfinals";
  if (Math.random() < advanceChance) {
    stage = "semifinals";
    if (Math.random() < advanceChance) {
      stage = "final";
      if (Math.random() < advanceChance) {
        stage = "champion";
      }
    }
  }
  return stage;
}
