import type { GeneralAttributeId, SpecialAttributeId } from "@/content/attributes";

export type Role = "top" | "jungle" | "mid" | "adc" | "support";

export type GameStatus =
  | "creating"
  | "in_season"
  | "event"
  | "match"
  | "retired";

export interface Character {
  nick: string;
  role: Role;
  team: string;
  league: string;
  /** Career starts under 18, in LCK Challengers. Turning 18 unlocks LCK call-up eligibility. */
  age: number;
}

export const LCK_CALLUP_MIN_AGE = 18;

export interface Relations {
  teamTrust: number;
  fanLoyalty: number;
  prestige: number;
  mentalHealth: number;
}

export interface DecisionLogEntry {
  season: number;
  eventId: string;
  choiceId: string;
  label: string;
}

export type EventCategory =
  | "transfers"
  | "locker_room"
  | "media"
  | "personal"
  | "competitive"
  | "role_specific"
  | "international";

/** Narrative importance -> magnitude range used when writing effects.
 *  minor ±3-8, medium ±8-15, major ±15-25. */
export type EventTier = "minor" | "medium" | "major";

export type RelationKey = keyof Relations;

export interface EventEffects {
  /** General events may only touch general attributes; role_specific events
   *  may touch that role's special attributes. Never mix the two. */
  attributes?: Partial<Record<GeneralAttributeId | SpecialAttributeId, number>>;
  relations?: Partial<Record<RelationKey, number>>;
}

export interface EventChoice {
  id: string;
  label: string;
  effects: EventEffects;
  /** Short narrative shown after picking this choice, before returning to the hub. */
  resolution: string;
  /** Choice ends the career immediately (e.g. early retirement). */
  endsCareer?: boolean;
}

/** A static (admin-editable) narrative event — as opposed to MaterializedEvent,
 *  which is generated at pick-time for transfer-market events naming real teams. */
export interface EventDefinition {
  id: string;
  category: EventCategory;
  tier: EventTier;
  title: string;
  description: string;
  /** Only fires for this role. Omit for events available to any role. */
  role?: Role;
  choices: EventChoice[];
}

/** A year is a fixed script of 9 local events across 3 phases, plus 3
 *  conditional international-tournament checkpoints in between. */
export type Phase = "pretemporada" | "invierno" | "verano";

export type TournamentTier = "first_stand" | "msi" | "worlds";

export type PhaseSlot =
  | { type: "event"; phase: Phase; category: EventCategory }
  | { type: "tournament"; tier: TournamentTier };

export type RetirementReason = "voluntary" | "stats" | "age";

export interface RosterSlot {
  role: Role;
  nick: string;
}

export interface LeagueStanding {
  teamId: string;
  points: number;
}

/**
 * Transfer-market events (rival offer, four offers, contract end) name real
 * teams at pick-time, so they're materialized dynamically instead of living
 * as static content — self-contained here (relations-only effects) to avoid
 * pulling in the full attribute-typed EventEffects from content/events.ts.
 */
export interface MaterializedChoice {
  id: string;
  label: string;
  relationEffects: Partial<Relations>;
  resolution: string;
  /** If set, picking this choice moves the player to this team id. */
  targetTeamId?: string;
  endsCareer?: boolean;
  /** UI-only: if set, this choice renders as a rich team-offer card (crest, colors,
   *  strength) instead of a plain text button. Set even for "stay/renew" choices
   *  (pointing at the current team) — separate from targetTeamId so renewing
   *  doesn't trigger the "joined a new club" logic in the store. */
  displayTeamId?: string;
  /** Short flavor tag shown on the offer card, e.g. "Grande", "Rival", "Renovación". */
  offerStamp?: string;
}

export interface MaterializedEvent {
  id: string;
  title: string;
  description: string;
  choices: MaterializedChoice[];
}

export interface CareerState {
  character: Character | null;
  season: number;
  attributes: Record<string, number>;
  relations: Relations;
  history: DecisionLogEntry[];
  currentEventId: string | null;
  status: GameStatus;
  /** This year's scripted sequence of event/tournament slots. */
  yearPlan: PhaseSlot[];
  /** Index into yearPlan of the slot currently shown (-1 = not started yet). */
  slotIndex: number;
  /** Event ids already used this year, to avoid immediate repeats. */
  seenEventIdsThisYear: string[];
  retirementReason: RetirementReason | null;
  /** Raw deltas from the last resolved choice, for the UI's up/down arrows.
   *  Cleared as soon as the player advances to the next slot. */
  lastEffects: {
    attributes: Record<string, number>;
    relations: Record<string, number>;
  } | null;
  /** Narrative text for the last resolved choice, shown before "Continuar". */
  lastResolution: string | null;
  /** Fictional teammates for the other 4 roles, rolled once at career start. */
  roster: RosterSlot[];
  /** Current league table, recomputed each year (cosmetic — no real match sim yet). */
  leagueStandings: LeagueStanding[];
  /** Set instead of a static EVENTS lookup when currentEventId is a
   *  transfer-market event that names real teams. */
  materializedEvent: MaterializedEvent | null;
  /** Narrative event pool — defaults to the bundled static list, replaced by
   *  the admin-edited Supabase list once useEvents() resolves (see hooks/useEvents.ts). */
  events: EventDefinition[];
}

export interface CareerResult {
  nick: string;
  role: Role;
  finalTeam: string;
  finalLeague: string;
  seasonsPlayed: number;
  score: number;
  summary: Record<string, unknown>;
}
