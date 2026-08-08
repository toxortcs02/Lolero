export interface LadderInfo {
  tier: string;
  lp: number;
  /** Only apex tiers (Maestro+) show a numbered ladder position, like the real client. */
  rankPosition?: string;
  gamesThisSplit: number;
}

const TIERS = [
  { name: "Hierro", max: 20 },
  { name: "Bronce", max: 35 },
  { name: "Plata", max: 50 },
  { name: "Oro", max: 62 },
  { name: "Platino", max: 72 },
  { name: "Esmeralda", max: 80 },
  { name: "Diamante", max: 88 },
  { name: "Maestro", max: 94 },
  { name: "Gran Maestro", max: 98 },
  { name: "Retador", max: 100 },
] as const;

const APEX_TIERS = new Set(["Maestro", "Gran Maestro", "Retador"]);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Cosmetic solo-queue ladder result, separate from the team's competitive
 *  results — driven by "Manos" (mechanical skill), the only stat that
 *  carries over 1-for-1 into solo queue. */
export function rollLadder(hands: number): LadderInfo {
  const tier = TIERS.find((t) => hands <= t.max) ?? TIERS[TIERS.length - 1];
  const isApex = APEX_TIERS.has(tier.name);
  return {
    tier: tier.name,
    lp: isApex ? randomInt(0, 900) : randomInt(0, 100),
    rankPosition: isApex ? `#${randomInt(1, 30)}k` : undefined,
    gamesThisSplit: randomInt(60, 180),
  };
}
