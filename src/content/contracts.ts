import type { TeamDefinition } from "@/content/teams";

export interface ContractInfo {
  /** Euros per year — placeholder economy, not researched real figures. */
  salaryPerYear: number;
  yearsRemaining: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Cosmetic salary, scaled by league tier + team strength + personal overall. */
export function rollContract(team: TeamDefinition, overall: number): ContractInfo {
  const base = 12000 + team.baseStrength * 2000 + overall * 150;
  const leagueMultiplier = team.league === "lck" ? 7 : 1;
  const salaryPerYear = Math.round((base * leagueMultiplier) / 500) * 500;
  return { salaryPerYear, yearsRemaining: randomInt(1, 3) };
}
