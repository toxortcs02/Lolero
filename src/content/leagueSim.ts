import type { LeagueStanding } from "@/types/game";
import type { TeamDefinition } from "@/content/teams";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Cosmetic league table — there's no real match simulation yet. Each
 * team's points are its historical baseStrength plus noise; the player's
 * own team also blends in their personal prestige, so playing well visibly
 * moves your team up the table.
 */
export function computeStandings(
  teams: TeamDefinition[],
  playerTeamId: string,
  playerPrestige: number,
): LeagueStanding[] {
  const standings = teams.map((team) => {
    const noise = randomInt(-15, 15);
    let points = clamp(team.baseStrength * 10 + noise);
    if (team.id === playerTeamId) {
      points = clamp(Math.round(points * 0.5 + playerPrestige * 0.5));
    }
    return { teamId: team.id, points };
  });

  return standings.sort((a, b) => b.points - a.points);
}
