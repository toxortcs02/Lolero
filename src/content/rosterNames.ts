import type { Role, RosterSlot } from "@/types/game";
import { ROLES } from "@/content/roles";

/** Generic gamer-style fictional nicks, mixing Korean-esports and
 *  international conventions. Pool is shared across all teams/careers. */
export const FICTIONAL_NICKS = [
  "Sohn", "Neon", "Vellum", "Kestrel", "Draven", "Aeris", "Bosco", "Ryuk",
  "Winnow", "Halcyon", "Jinjo", "Tempest", "Vale", "Choso", "Rekindle",
  "Nyxen", "Orin", "Sablewing", "Kairo", "Yeondu", "Lucent", "Torque",
  "Miho", "Ashkore", "Verdant", "Doeun", "Fenwick", "Icarion", "Junho",
  "Kestral", "Loomis", "Mireu", "Nightsong", "Obelisk", "Pyrrha", "Quillon",
  "Rhaeon", "Seoya", "Tundra", "Ulvric", "Vexen", "Wraithe", "Xylo",
  "Yeoreum", "Zephyrin", "Baram", "Corvid", "Daehyun", "Emberlyn", "Frostbyte",
] as const;

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Rolls 4 fictional teammates, one per role other than the player's. */
export function generateRoster(playerRole: Role): RosterSlot[] {
  const otherRoles = ROLES.filter((r) => r !== playerRole);
  const nicks = shuffle(FICTIONAL_NICKS).slice(0, otherRoles.length);
  return otherRoles.map((role, i) => ({ role, nick: nicks[i] }));
}
