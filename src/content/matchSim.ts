import type { Role } from "@/types/game";

interface SingleGameResult {
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
}

export interface MatchResult {
  /** 1 for a tournament checkpoint, REGULAR_SEASON_GAMES for the regular-season split. */
  gamesPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
}

/** LCK/LPL-style round robin split length — the "competitive" category event
 *  represents the whole regular season at once, not a single game. */
export const REGULAR_SEASON_GAMES = 18;

/** Rough KDA shape per role — ranges are pre-skill-adjustment. */
const ROLE_KDA_PROFILE: Record<
  Role,
  { kills: [number, number]; deaths: [number, number]; assists: [number, number] }
> = {
  top: { kills: [1, 5], deaths: [1, 4], assists: [1, 5] },
  jungle: { kills: [1, 4], deaths: [1, 4], assists: [3, 9] },
  mid: { kills: [2, 7], deaths: [1, 4], assists: [2, 6] },
  adc: { kills: [2, 8], deaths: [1, 4], assists: [1, 5] },
  support: { kills: [0, 2], deaths: [1, 4], assists: [4, 12] },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simulateSingleGame(role: Role, overall: number, teamStrength: number): SingleGameResult {
  const strengthFactor = (teamStrength - 5.5) / 10; // ~ -0.45..0.45
  const overallFactor = (overall - 50) / 200; // ~ -0.25..0.25
  const winChance = Math.min(0.85, Math.max(0.15, 0.5 + strengthFactor + overallFactor));
  const win = Math.random() < winChance;

  const profile = ROLE_KDA_PROFILE[role];
  const skill = Math.min(1, Math.max(0, overall / 100));
  const kills = randomInt(...profile.kills) + Math.round(skill * 2) + (win ? 1 : 0);
  const deaths = Math.max(0, randomInt(...profile.deaths) - Math.round(skill * 1.5) - (win ? 1 : 0));
  const assists = randomInt(...profile.assists) + Math.round(skill * 2);

  return { win, kills, deaths, assists };
}

/** Cosmetic result for a single game — tournament checkpoints (First Stand/MSI/Worlds). */
export function simulateMatch(role: Role, overall: number, teamStrength: number): MatchResult {
  const g = simulateSingleGame(role, overall, teamStrength);
  return {
    gamesPlayed: 1,
    wins: g.win ? 1 : 0,
    losses: g.win ? 0 : 1,
    kills: g.kills,
    deaths: g.deaths,
    assists: g.assists,
  };
}

/** Cosmetic result for a whole regular-season split (REGULAR_SEASON_GAMES games at
 *  once) — the "competitive" category event represents the full season, not 1 game. */
export function simulateSplit(
  role: Role,
  overall: number,
  teamStrength: number,
  games: number = REGULAR_SEASON_GAMES,
): MatchResult {
  const result: MatchResult = { gamesPlayed: games, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
  for (let i = 0; i < games; i++) {
    const g = simulateSingleGame(role, overall, teamStrength);
    if (g.win) result.wins += 1;
    else result.losses += 1;
    result.kills += g.kills;
    result.deaths += g.deaths;
    result.assists += g.assists;
  }
  return result;
}

export function isPositiveResult(result: MatchResult): boolean {
  return result.wins >= result.losses;
}
