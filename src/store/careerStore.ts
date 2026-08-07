import { create } from "zustand";
import type { CareerState, Character, DecisionLogEntry } from "@/types/game";
import { EVENTS } from "@/content/events";
import { rollStartingAttributes, STARTING_ATTRIBUTE_VALUE } from "@/content/attributes";
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
  buildDynamicTransferEvent,
  DYNAMIC_TRANSFER_EVENT_IDS,
} from "@/content/transferEvents";

function teamIdForName(teamName: string): string {
  return TEAMS.find((t) => t.name === teamName)?.id ?? TEAMS[0].id;
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
  startCareer: (character: Character) => void;
  /** Advances to the next slot in the year plan: an event, a qualifying
   *  tournament, or (if the plan is exhausted) the start of a new year. */
  advance: () => void;
  resolveEventChoice: (choiceId: string) => void;
  reset: () => void;
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
};

export const useCareerStore = create<CareerState & CareerActions>((set, get) => ({
  ...initialState,

  startCareer: (character) => {
    const playerTeamId = teamIdForName(character.team);
    set({
      character,
      status: "in_season",
      season: 1,
      attributes: rollStartingAttributes(character.role),
      yearPlan: buildYearPlan(),
      slotIndex: -1,
      seenEventIdsThisYear: [],
      currentEventId: null,
      retirementReason: null,
      lastEffects: null,
      lastResolution: null,
      roster: generateRoster(character.role),
      leagueStandings: computeStandings(TEAMS, playerTeamId, 0),
      materializedEvent: null,
    });
  },

  advance: () => {
    const state = get();
    if (!state.character || state.status === "retired") return;

    let idx = state.slotIndex + 1;
    let plan = state.yearPlan;
    let season = state.season;
    let character = state.character;
    let seen = state.seenEventIdsThisYear;
    let leagueStandings = state.leagueStandings;

    // Loop past tournament slots the player didn't qualify for, and roll
    // over into a new year when the current one's plan is exhausted.
    for (;;) {
      if (idx >= plan.length) {
        const nextAge = character.age + 1;
        if (nextAge > MAX_CAREER_AGE) {
          set({ status: "retired", retirementReason: "age" });
          return;
        }
        character = { ...character, age: nextAge };
        season += 1;
        plan = buildYearPlan();
        seen = [];
        idx = 0;
        // New season, new (cosmetic) league table — your prestige weighs in.
        leagueStandings = computeStandings(
          TEAMS,
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

      const eventId = pickEventId(slot.category, character.role, seen);
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
          leagueStandings = computeStandings(TEAMS, newTeam.id, relations.prestige);
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

    const event = EVENTS.find((e) => e.id === state.currentEventId);
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

  reset: () => set(initialState),
}));
