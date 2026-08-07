import type {
  EventCategory,
  Phase,
  PhaseSlot,
  Relations,
  Role,
  TournamentTier,
} from "@/types/game";
import type { EventDefinition } from "@/content/events";

export const PHASE_LABELS: Record<Phase, string> = {
  pretemporada: "Pretemporada",
  invierno: "Temporada de invierno",
  verano: "Temporada de verano",
};

export const TOURNAMENT_LABELS: Record<TournamentTier, string> = {
  first_stand: "First Stand (Tier B/Academy)",
  msi: "MSI (Tier B/Academy)",
  worlds: "Worlds (Tier B/Academy)",
};

export const TOURNAMENT_EVENT_IDS: Record<TournamentTier, string> = {
  first_stand: "intl_first_stand",
  msi: "intl_msi",
  worlds: "intl_worlds",
};

/** Placeholder qualification rule until real standings/simulation exist. */
const TOURNAMENT_PRESTIGE_THRESHOLD: Record<TournamentTier, number> = {
  first_stand: 40,
  msi: 55,
  worlds: 70,
};

export function qualifiesForTournament(
  tier: TournamentTier,
  relations: Relations,
): boolean {
  return relations.prestige >= TOURNAMENT_PRESTIGE_THRESHOLD[tier];
}

/**
 * One year = 1 local event per phase, with a tournament checkpoint after
 * each phase. Personal, media and role_specific don't have a fixed slot
 * for now — pending a future spot in the year plan.
 */
export function buildYearPlan(): PhaseSlot[] {
  return [
    { type: "event", phase: "pretemporada", category: "transfers" },
    { type: "tournament", tier: "first_stand" },
    { type: "event", phase: "invierno", category: "locker_room" },
    { type: "tournament", tier: "msi" },
    { type: "event", phase: "verano", category: "competitive" },
    { type: "tournament", tier: "worlds" },
  ];
}

/** Picks a random event for a category, avoiding this year's repeats when possible.
 *  Takes the event pool as a parameter (not a module-level import) so callers can
 *  pass the admin-edited, DB-backed list instead of the bundled static one. */
export function pickEventId(
  events: EventDefinition[],
  category: EventCategory,
  role: Role,
  excludeIds: string[],
): string {
  const pool = events.filter(
    (e) => e.category === category && (e.role === undefined || e.role === role),
  );
  const fresh = pool.filter((e) => !excludeIds.includes(e.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}
