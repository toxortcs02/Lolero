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
