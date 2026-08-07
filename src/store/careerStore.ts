import { create } from "zustand";
import type { CareerState, Character, DecisionLogEntry } from "@/types/game";
import { LCK_CALLUP_MIN_AGE } from "@/types/game";
import { EVENTS } from "@/content/events";
import {
  getOverall,
  rollProdigyAttributes,
  rollStartingAttributes,
  STARTING_ATTRIBUTE_VALUE,
} from "@/content/attributes";
import { MAX_CAREER_AGE } from "@/content/roles";
import { generateRoster } from "@/content/rosterNames";
import { computeStandings } from "@/content/leagueSim";
import { TEAMS } from "@/content/teams";
import {
  buildYearPlan,
  pickEventId,
  qualifiesForTournament,
  TOURNAMENT_EVENT_IDS,
} from "@/content/seasonPlan";
import {
  buildAcademyCallupEvent,
  buildDebutEvent,
  buildDynamicTransferEvent,
  buildLeagueChampionOffersEvent,
  buildTier1OffersEvent,
  DYNAMIC_TRANSFER_EVENT_IDS,
} from "@/content/transferEvents";

/** Chance per career start that the roll is a "prodigy" one — see startCareer. */
const PRODIGY_START_CHANCE = 0.05;
/** Chance per season, once eligible, that your own org calls you up to its LCK roster. */
const ACADEMY_CALLUP_CHANCE = 0.05;
const TIER1_OFFERS_OVERALL_THRESHOLD = 70;
const ACADEMY_CALLUP_OVERALL_THRESHOLD = 60;

function teamIdForName(teamName: string): string {
  return TEAMS.find((t) => t.name === teamName)?.id ?? TEAMS[0].id;
}

/** Teams sharing a league with the given team id — for standings/offers that must stay within one tier. */
function leagueTeams(teamId: string) {
  const league = TEAMS.find((t) => t.id === teamId)?.league ?? "challengers";
  return TEAMS.filter((t) => t.league === league);
}

function isDynamicTransferEvent(
  eventId: string | null,
): eventId is (typeof DYNAMIC_TRANSFER_EVENT_IDS)[number] {
  return !!eventId && (DYNAMIC_TRANSFER_EVENT_IDS as readonly string[]).includes(eventId);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

interface CareerActions {
  /** isProdigy: rare boosted roll (see crear/page.tsx) — career starts directly in LCK. */
  startCareer: (character: Character, isProdigy?: boolean) => void;
  /** Advances to the next slot in the year plan: an event, a qualifying
   *  tournament, or (if the plan is exhausted) the start of a new year. */
  advance: () => void;
  resolveEventChoice: (choiceId: string) => void;
  reset: () => void;
  /** Replaces the event pool with the admin-edited, DB-backed list — see hooks/useEvents.ts. */
  setEvents: (events: CareerState["events"]) => void;
}

const initialState: CareerState = {
  character: null,
  season: 1,
  attributes: {},
  relations: {
    teamTrust: 50,
    fanLoyalty: 50,
    prestige: 0,
    mentalHealth: 100,
  },
  history: [],
  currentEventId: null,
  status: "creating",
  yearPlan: [],
  slotIndex: -1,
  seenEventIdsThisYear: [],
  retirementReason: null,
  lastEffects: null,
  lastResolution: null,
  roster: [],
  leagueStandings: [],
  materializedEvent: null,
  events: EVENTS,
};

export const useCareerStore = create<CareerState & CareerActions>((set, get) => ({
  ...initialState,

  startCareer: (character, isProdigy = false) => {
    const playerTeamId = teamIdForName(character.team);
    set({
      character,
      status: "in_season",
      season: 1,
      attributes: isProdigy
        ? rollProdigyAttributes(character.role)
        : rollStartingAttributes(character.role),
      yearPlan: buildYearPlan(),
      slotIndex: -1,
      seenEventIdsThisYear: [],
      currentEventId: null,
      retirementReason: null,
      lastEffects: null,
      lastResolution: null,
      roster: generateRoster(character.role),
      leagueStandings: computeStandings(leagueTeams(playerTeamId), playerTeamId, 0),
      materializedEvent: null,
    });
    // Resolve the first slot synchronously here instead of leaving it to a
    // page-level effect: under React StrictMode dev double-invoke, an
    // effect-triggered advance() reads live state via get() on both calls,
    // so the second call would see slotIndex already at 0 and skip straight
    // to slot 1 — silently dropping the year's first event.
    get().advance();
  },

  advance: () => {
    const state = get();
    if (!state.character || state.status === "retired") return;

    // True exactly once per career: the very first advance() call, right
    // after startCareer. The team is already assigned at this point (rolled
    // in /crear) — there's no prior club to be "transferred" from, so this
    // must never render as a market/rival-offer event, see buildDebutEvent.
    const isCareerDebut = state.slotIndex === -1;

    let idx = state.slotIndex + 1;
    let plan = state.yearPlan;
    let season = state.season;
    let character = state.character;
    let seen = state.seenEventIdsThisYear;
    let leagueStandings = state.leagueStandings;
    // Set right before a season rolls over, from the standings that season
    // just ended with — checked at the new season's transfers slot below.
    let finishedFirst = false;

    // Loop past tournament slots the player didn't qualify for, and roll
    // over into a new year when the current one's plan is exhausted.
    for (;;) {
      if (idx >= plan.length) {
        const nextAge = character.age + 1;
        if (nextAge > MAX_CAREER_AGE) {
          set({ status: "retired", retirementReason: "age" });
          return;
        }
        finishedFirst = state.leagueStandings[0]?.teamId === teamIdForName(character.team);
        character = { ...character, age: nextAge };
        season += 1;
        plan = buildYearPlan();
        seen = [];
        idx = 0;
        // New season, new (cosmetic) league table — your prestige weighs in.
        leagueStandings = computeStandings(
          leagueTeams(teamIdForName(character.team)),
          teamIdForName(character.team),
          state.relations.prestige,
        );
        continue;
      }

      const slot = plan[idx];

      if (slot.type === "tournament") {
        if (!qualifiesForTournament(slot.tier, state.relations)) {
          idx += 1;
          continue;
        }
        set({
          character,
          season,
          yearPlan: plan,
          slotIndex: idx,
          seenEventIdsThisYear: seen,
          currentEventId: TOURNAMENT_EVENT_IDS[slot.tier],
          status: "event",
          lastEffects: null,
          lastResolution: null,
          leagueStandings,
          materializedEvent: null,
        });
        return;
      }

      // El slot de "transfers" nunca se sortea al azar de punta a punta:
      // primero se chequean, en orden, el debut (prioridad absoluta, ver
      // isCareerDebut arriba) y las condiciones de ascenso a LCK. Ninguno de
      // estos pasa por pickEventId() — son explícitos, no un sorteo.
      if (slot.category === "transfers") {
        const playerTeamId = teamIdForName(character.team);

        if (isCareerDebut) {
          const debutEvent = buildDebutEvent(TEAMS, playerTeamId);
          set({
            character,
            season,
            yearPlan: plan,
            slotIndex: idx,
            seenEventIdsThisYear: [...seen, debutEvent.id],
            currentEventId: debutEvent.id,
            status: "event",
            lastEffects: null,
            lastResolution: null,
            leagueStandings,
            materializedEvent: debutEvent,
          });
          return;
        }

        const playerLeague = TEAMS.find((t) => t.id === playerTeamId)?.league ?? "challengers";

        if (playerLeague === "challengers") {
          const overall = getOverall(state.attributes, character.role);
          const promoEvent = finishedFirst
            ? buildLeagueChampionOffersEvent(TEAMS, playerTeamId)
            : overall >= TIER1_OFFERS_OVERALL_THRESHOLD
              ? buildTier1OffersEvent(TEAMS, playerTeamId)
              : character.age >= LCK_CALLUP_MIN_AGE &&
                  overall >= ACADEMY_CALLUP_OVERALL_THRESHOLD &&
                  Math.random() < ACADEMY_CALLUP_CHANCE
                ? buildAcademyCallupEvent(TEAMS, playerTeamId)
                : null;

          if (promoEvent) {
            set({
              character,
              season,
              yearPlan: plan,
              slotIndex: idx,
              seenEventIdsThisYear: [...seen, promoEvent.id],
              currentEventId: promoEvent.id,
              status: "event",
              lastEffects: null,
              lastResolution: null,
              leagueStandings,
              materializedEvent: promoEvent,
            });
            return;
          }
        }
      }

      const eventId = pickEventId(state.events, slot.category, character.role, seen);
      const materializedEvent = isDynamicTransferEvent(eventId)
        ? buildDynamicTransferEvent(eventId, TEAMS, teamIdForName(character.team))
        : null;

      set({
        character,
        season,
        yearPlan: plan,
        slotIndex: idx,
        seenEventIdsThisYear: [...seen, eventId],
        currentEventId: eventId,
        status: "event",
        lastEffects: null,
        lastResolution: null,
        leagueStandings,
        materializedEvent,
      });
      return;
    }
  },

  resolveEventChoice: (choiceId) => {
    const state = get();

    if (state.materializedEvent && state.materializedEvent.id === state.currentEventId) {
      const { materializedEvent, character } = state;
      const choice = materializedEvent.choices.find((c) => c.id === choiceId);
      if (!choice || !character) return;

      const relations = { ...state.relations };
      for (const [key, delta] of Object.entries(choice.relationEffects)) {
        const k = key as keyof typeof relations;
        relations[k] = clamp(relations[k] + (delta ?? 0));
      }

      const logEntry: DecisionLogEntry = {
        season: state.season,
        eventId: materializedEvent.id,
        choiceId: choice.id,
        label: choice.label,
      };

      let nextCharacter = character;
      let roster = state.roster;
      let leagueStandings = state.leagueStandings;

      if (choice.targetTeamId) {
        const newTeam = TEAMS.find((t) => t.id === choice.targetTeamId);
        if (newTeam) {
          nextCharacter = { ...character, team: newTeam.name };
          relations.teamTrust = 50; // fresh relationship with the new club
          roster = generateRoster(character.role);
          leagueStandings = computeStandings(leagueTeams(newTeam.id), newTeam.id, relations.prestige);
        }
      }

      set({
        character: nextCharacter,
        relations,
        roster,
        leagueStandings,
        history: [...state.history, logEntry],
        currentEventId: null,
        materializedEvent: null,
        status: choice.endsCareer
          ? "retired"
          : relations.teamTrust <= 0 || relations.mentalHealth <= 0
            ? "retired"
            : "in_season",
        retirementReason: choice.endsCareer
          ? "voluntary"
          : relations.teamTrust <= 0 || relations.mentalHealth <= 0
            ? "stats"
            : null,
        lastEffects: { attributes: {}, relations: choice.relationEffects },
        lastResolution: choice.resolution,
      });
      return;
    }

    const event = state.events.find((e) => e.id === state.currentEventId);
    const choice = event?.choices.find((c) => c.id === choiceId);
    if (!event || !choice) return;

    const attributes = { ...state.attributes };
    for (const [key, delta] of Object.entries(choice.effects.attributes ?? {})) {
      attributes[key] = clamp((attributes[key] ?? STARTING_ATTRIBUTE_VALUE) + (delta ?? 0));
    }

    const relations = { ...state.relations };
    for (const [key, delta] of Object.entries(choice.effects.relations ?? {})) {
      const k = key as keyof typeof relations;
      relations[k] = clamp(relations[k] + (delta ?? 0));
    }

    const logEntry: DecisionLogEntry = {
      season: state.season,
      eventId: event.id,
      choiceId: choice.id,
      label: choice.label,
    };

    const lastEffects = {
      attributes: choice.effects.attributes ?? {},
      relations: choice.effects.relations ?? {},
    };

    if (choice.endsCareer) {
      set({
        attributes,
        relations,
        history: [...state.history, logEntry],
        currentEventId: null,
        status: "retired",
        retirementReason: "voluntary",
        lastEffects,
        lastResolution: choice.resolution,
      });
      return;
    }

    const forcedOut = relations.teamTrust <= 0 || relations.mentalHealth <= 0;

    set({
      attributes,
      relations,
      history: [...state.history, logEntry],
      currentEventId: null,
      status: forcedOut ? "retired" : "in_season",
      retirementReason: forcedOut ? "stats" : null,
      lastEffects,
      lastResolution: choice.resolution,
    });
  },

  reset: () => set((state) => ({ ...initialState, events: state.events })),

  setEvents: (events) => set({ events }),
}));
