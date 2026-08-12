import type { TeamDefinition } from "@/content/teams";
import { STARTING_AGE, MAX_CAREER_AGE } from "@/content/roles";

export interface ContractInfo {
  /** Euros per year — placeholder economy, not researched real figures. */
  salaryPerYear: number;
  yearsRemaining: number;
}

export interface RollContractOptions {
  /** 0-100, accumulated career prestige — closes the "just a chance" pay gap. */
  prestige?: number;
  /** 0-100, fan/community loyalty — small per-follower bump, see fanBonus(). */
  fanLoyalty?: number;
  /** A new club taking you on (debut, transfer, call-up) pays below market until you've proven it there — as opposed to a same-club renewal. */
  isOpportunity?: boolean;
  /** Fresh off winning the league — salaries roughly double and offers pour in. */
  isChampion?: boolean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Academy/youth rosters (development squads) don't pay a base salary. */
const ACADEMY_TEAM_IDS = new Set(["gen-ga", "t1-a", "fearx-y"]);

/**
 * Career-stage curve: rookies and players nearing retirement earn a fraction
 * of what a player in their prime commands. Sampled across the in-game age
 * range (STARTING_AGE..MAX_CAREER_AGE), peaking at mid-career.
 */
const AGE_CURVE = [0.5, 0.8, 1.0, 1.2, 1.5, 1.2, 1.0, 0.8, 0.5];

function ageMultiplier(age: number, overall: number): number {
  const clamped = Math.min(Math.max(age, STARTING_AGE), MAX_CAREER_AGE);
  const span = MAX_CAREER_AGE - STARTING_AGE || 1;
  const t = (clamped - STARTING_AGE) / span;
  const idx = Math.round(t * (AGE_CURVE.length - 1));
  const raw = AGE_CURVE[idx];

  // Only rookies get softened — once you're past the curve's rising half
  // (t >= 0.5) there's no "young promise" discount left to soften.
  if (raw >= 1 || t >= 0.5) return raw;

  // A standout overall for your age (young promise) closes most — not all —
  // of the rookie pay gap.
  const prodigyFactor = Math.min(Math.max((overall - 60) / 35, 0), 1);
  return raw + (1 - raw) * prodigyFactor * 0.7;
}

function fanBonus(fanLoyalty: number): number {
  // No real follower count in the sim — extrapolate one from loyalty (0-100)
  // so a beloved star's fanbase visibly nudges the offer.
  const followers = Math.round((fanLoyalty / 100) ** 1.5 * 2_000_000);
  return followers * 0.0025;
}

/** Cosmetic salary, scaled by league tier + team strength + personal overall + career stage. */
export function rollContract(
  team: TeamDefinition,
  overall: number,
  age: number,
  options: RollContractOptions = {},
): ContractInfo {
  const { prestige = 0, fanLoyalty = 50, isOpportunity = false, isChampion = false } = options;

  if (ACADEMY_TEAM_IDS.has(team.id)) {
    return { salaryPerYear: 0, yearsRemaining: randomInt(1, 2) };
  }

  const base = 12000 + team.baseStrength * 2000 + overall * 150;
  const leagueMultiplier = team.league === "lck" ? 7 : 1;

  // A big club "giving you a shot" pays below market until your prestige
  // catches up with its reputation — a proven star doesn't get this discount.
  const opportunityDiscount = isOpportunity
    ? 1 - Math.max(0, team.baseStrength / 10 - prestige / 100) * 0.3
    : 1;

  const championMultiplier = isChampion ? 2 : 1;

  const salaryBeforeFans =
    base * leagueMultiplier * ageMultiplier(age, overall) * opportunityDiscount * championMultiplier;
  const salaryPerYear = Math.max(
    0,
    Math.round((salaryBeforeFans + fanBonus(fanLoyalty)) / 500) * 500,
  );

  return { salaryPerYear, yearsRemaining: randomInt(1, 3) };
}
