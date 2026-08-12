import type { Role } from "@/types/game";
import type { PlayoffStage } from "@/content/playoffs";

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

/** Rough KDA shape per role — ranges are pre-performance-adjustment. */
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function winChanceFor(overall: number, teamStrength: number): number {
  const strengthFactor = (teamStrength - 5.5) / 10; // ~ -0.45..0.45
  const overallFactor = (overall - 50) / 200; // ~ -0.25..0.25
  return clamp(0.5 + strengthFactor + overallFactor, 0.15, 0.85);
}

/** 0-100 season performance from the win/loss margin, not the raw win count —
 *  16-2 reads as a much stronger season than 9-9, which in turn beats 6-12,
 *  even though "9 wins" alone sounds fine on paper. */
function marginPerformance(wins: number, losses: number, games: number): number {
  const margin = games > 0 ? (wins - losses) / games : 0; // -1..1
  return clamp(50 + margin * 50, 0, 100);
}

/** How much better (0+) the player individually rates than their team overall —
 *  overall is already 0-100, teamStrength is 1-10, so both get put on the same
 *  0-10 "score" scale before comparing (e.g. jugador 8 vs equipo 6). */
function carryFactor(overall: number, teamStrength: number): number {
  const playerScore = overall / 10;
  return Math.max(0, playerScore - teamStrength);
}

/**
 * Cosmetic result for a single game — tournament checkpoints (First
 * Stand/MSI/Worlds). Reuses the season-performance shape for a "season of 1":
 * a win still reads as a much better game than a loss.
 */
export function simulateMatch(role: Role, overall: number, teamStrength: number): MatchResult {
  const win = Math.random() < winChanceFor(overall, teamStrength);
  const perf = marginPerformance(win ? 1 : 0, win ? 0 : 1, 1);
  const personalPerf = Math.min(100, perf + carryFactor(overall, teamStrength) * 8);

  const profile = ROLE_KDA_PROFILE[role];
  const skill = personalPerf / 100;
  const kills = randomInt(...profile.kills) + Math.round(skill * 3);
  const deaths = Math.max(0, randomInt(...profile.deaths) - Math.round(skill * 2));
  const assists = randomInt(...profile.assists) + Math.round(skill * 3);

  return { gamesPlayed: 1, wins: win ? 1 : 0, losses: win ? 0 : 1, kills, deaths, assists };
}

/**
 * Cosmetic result for a whole regular-season split (REGULAR_SEASON_GAMES
 * games at once) — the "competitive" category event represents the full
 * season, not 1 game.
 *
 * KDA is derived from the season's actual result, not rolled independently
 * of it: the win/loss record comes first, then a 0-100 performance score
 * from the win margin (16-2 » 12-6 » 9-9, even at the same win count) drives
 * how good the stat line looks — individual wins still read better than
 * individual losses within that. A player clearly better than their team
 * (see carryFactor) keeps a personal edge even through a bad team season.
 */
export function simulateSplit(
  role: Role,
  overall: number,
  teamStrength: number,
  games: number = REGULAR_SEASON_GAMES,
): MatchResult {
  const gameWins: boolean[] = [];
  let wins = 0;
  let losses = 0;
  const winChance = winChanceFor(overall, teamStrength);
  for (let i = 0; i < games; i++) {
    const win = Math.random() < winChance;
    gameWins.push(win);
    if (win) wins += 1;
    else losses += 1;
  }

  const seasonPerf = marginPerformance(wins, losses, games);
  const personalPerf = Math.min(100, seasonPerf + carryFactor(overall, teamStrength) * 8);

  const profile = ROLE_KDA_PROFILE[role];
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  for (const win of gameWins) {
    const gamePerf = clamp(personalPerf + (win ? 10 : -10), 0, 100);
    const skill = gamePerf / 100;
    kills += randomInt(...profile.kills) + Math.round(skill * 3);
    deaths += Math.max(0, randomInt(...profile.deaths) - Math.round(skill * 2));
    assists += randomInt(...profile.assists) + Math.round(skill * 3);
  }

  return { gamesPlayed: games, wins, losses, kills, deaths, assists };
}

/** 0-100 playoff performance, from how far the run went — "no_qualified" is
 *  neutral (no playoffs played, nothing to fold into the season KDA). */
function playoffPerformance(stage: PlayoffStage): number {
  switch (stage) {
    case "quarterfinals":
      return 35;
    case "semifinals":
      return 55;
    case "final":
      return 75;
    case "champion":
      return 100;
    case "no_qualified":
    default:
      return 50;
  }
}

/**
 * Folds how the playoff run went into an already-simulated season's KDA
 * totals — same win/loss-margin-to-performance shape as the regular season,
 * applied as a proportional nudge (up to ±15%) across the existing stat
 * line rather than re-rolling it from scratch.
 */
export function applyPlayoffAdjustment(
  stats: { kills: number; deaths: number; assists: number },
  stage: PlayoffStage,
): { kills: number; deaths: number; assists: number } {
  if (stage === "no_qualified") return stats;

  const swing = (playoffPerformance(stage) - 50) / 50; // -0.3..1
  const factor = 1 + swing * 0.15;
  return {
    kills: Math.max(0, Math.round(stats.kills * factor)),
    deaths: Math.max(0, Math.round(stats.deaths / factor)),
    assists: Math.max(0, Math.round(stats.assists * factor)),
  };
}

export function isPositiveResult(result: MatchResult): boolean {
  return result.wins >= result.losses;
}
