"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { EVENTS } from "@/content/events";
import { useTeams } from "@/hooks/useTeams";
import { ROLE_LABELS } from "@/content/roles";
import { ATTRIBUTE_LABELS, GENERAL_ATTRIBUTES, ROLE_SPECIAL_ATTRIBUTES } from "@/content/attributes";
import { PHASE_LABELS, TOURNAMENT_LABELS } from "@/content/seasonPlan";
import { TeamBadge } from "@/components/TeamBadge";
import type { TeamDefinition } from "@/content/teams";
import type { LeagueStanding, Role, RosterSlot } from "@/types/game";

export default function CarreraHubPage() {
  const router = useRouter();
  const character = useCareerStore((s) => s.character);
  const season = useCareerStore((s) => s.season);
  const attributes = useCareerStore((s) => s.attributes);
  const relations = useCareerStore((s) => s.relations);
  const history = useCareerStore((s) => s.history);
  const status = useCareerStore((s) => s.status);
  const currentEventId = useCareerStore((s) => s.currentEventId);
  const yearPlan = useCareerStore((s) => s.yearPlan);
  const slotIndex = useCareerStore((s) => s.slotIndex);
  const lastEffects = useCareerStore((s) => s.lastEffects);
  const lastResolution = useCareerStore((s) => s.lastResolution);
  const advance = useCareerStore((s) => s.advance);
  const resolveEventChoice = useCareerStore((s) => s.resolveEventChoice);
  const roster = useCareerStore((s) => s.roster);
  const leagueStandings = useCareerStore((s) => s.leagueStandings);
  const materializedEvent = useCareerStore((s) => s.materializedEvent);
  const teams = useTeams();

  useEffect(() => {
    if (!character) {
      router.replace("/crear");
      return;
    }
    if (status === "retired") {
      router.replace("/retiro");
      return;
    }
    // Kick off the very first slot of the career automatically.
    if (slotIndex === -1 && status === "in_season") advance();
  }, [character, status, slotIndex, advance, router]);

  if (!character) return null;

  const team = teams.find((t) => t.name === character.team);
  const currentEvent = materializedEvent ?? EVENTS.find((e) => e.id === currentEventId);
  const currentSlot = slotIndex >= 0 ? yearPlan[slotIndex] : undefined;

  const phaseTag =
    currentSlot?.type === "tournament"
      ? TOURNAMENT_LABELS[currentSlot.tier]
      : currentSlot
        ? PHASE_LABELS[currentSlot.phase]
        : null;

  function handleChoice(choiceId: string) {
    const endsCareer = currentEvent?.choices.find((c) => c.id === choiceId)
      ?.endsCareer;
    resolveEventChoice(choiceId);
    if (endsCareer) router.push("/retiro");
  }

  const generalIds = GENERAL_ATTRIBUTES.map((a) => a.id);
  const roleIds = ROLE_SPECIAL_ATTRIBUTES[character.role];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10 lg:max-w-7xl">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-stretch">
        {/* Equipo/roster: misma columna que los otros dos cuadros en desktop */}
        {team && (
          <TeamRosterPanel
            team={team}
            playerNick={character.nick}
            playerRole={character.role}
            roster={roster}
          />
        )}

        <div className="flex flex-col gap-6">
          {/* Panel fijo: info + stats, siempre visible */}
          <section className="hx-panel flex flex-col gap-4 rounded-xl p-4">
            <div className="flex items-center gap-4">
              {team && <TeamBadge team={team} size={72} />}
              <div>
                <h1 className="hx-title text-xl font-bold">{character.nick}</h1>
                <p className="text-sm text-hx-grey">
                  {ROLE_LABELS[character.role]} · {character.team} ·{" "}
                  {character.age} años · Año {season}
                  {phaseTag ? ` · ${phaseTag}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="hx-label text-xs font-medium">Relaciones</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat
                  label="Confianza equipo"
                  value={relations.teamTrust}
                  delta={lastEffects?.relations.teamTrust}
                />
                <Stat
                  label="Fidelidad fans"
                  value={relations.fanLoyalty}
                  delta={lastEffects?.relations.fanLoyalty}
                />
                <Stat
                  label="Prestigio"
                  value={relations.prestige}
                  delta={lastEffects?.relations.prestige}
                />
                <Stat
                  label="Salud mental"
                  value={relations.mentalHealth}
                  delta={lastEffects?.relations.mentalHealth}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="hx-label text-xs font-medium">Atributos generales</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {generalIds.map((id) => (
                  <Stat
                    key={id}
                    label={ATTRIBUTE_LABELS[id]}
                    value={attributes[id] ?? 0}
                    delta={lastEffects?.attributes[id]}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="hx-label text-xs font-medium">
                Atributos de {ROLE_LABELS[character.role]}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {roleIds.map((id) => (
                  <Stat
                    key={id}
                    label={ATTRIBUTE_LABELS[id]}
                    value={attributes[id] ?? 0}
                    delta={lastEffects?.attributes[id]}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Panel dinámico: evento actual o acciones de temporada */}
          <section className="hx-panel flex flex-col gap-4 rounded-xl p-4">
            {currentEvent ? (
              <>
                <div className="flex flex-col gap-1">
                  {phaseTag && <span className="hx-label text-xs font-medium">{phaseTag}</span>}
                  <h2 className="hx-title text-lg font-bold">{currentEvent.title}</h2>
                  <p className="text-sm text-hx-grey">{currentEvent.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {currentEvent.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoice(choice.id)}
                      className="hx-choice rounded-lg px-4 py-3 text-left text-sm"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </>
            ) : lastResolution ? (
              <>
                <p className="text-sm leading-relaxed text-hx-gold-bright">{lastResolution}</p>
                <button onClick={advance} className="hx-btn-primary rounded-full px-6 py-3">
                  Continuar
                </button>
              </>
            ) : (
              <>
                <button onClick={advance} className="hx-btn-primary rounded-full px-6 py-3">
                  Continuar
                </button>

                {history.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h2 className="hx-label text-xs font-medium">Historial</h2>
                    <ul className="flex flex-col gap-1 text-sm text-hx-grey">
                      {[...history].reverse().map((h, i) => (
                        <li key={i}>
                          Año {h.season}: {h.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Tabla de posiciones: misma columna que los otros dos cuadros en desktop */}
        <LeagueTablePanel teams={teams} standings={leagueStandings} playerTeam={team} />
      </div>
    </main>
  );
}

function TeamRosterPanel({
  team,
  playerNick,
  playerRole,
  roster,
}: {
  team: TeamDefinition;
  playerNick: string;
  playerRole: Role;
  roster: RosterSlot[];
}) {
  return (
    <section className="hx-panel flex h-full flex-col gap-5 rounded-xl p-6">
      <h2 className="hx-label text-sm font-medium">Tu equipo</h2>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <TeamBadge team={team} size={112} />
        <h3 className="hx-title text-lg font-bold">{team.name}</h3>
        {team.jerseyUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded URL
          <img
            src={team.jerseyUrl}
            alt={`Camiseta de ${team.name}`}
            className="h-48 w-auto rounded border border-hx-border object-contain"
          />
        ) : (
          <div className="flex h-48 w-36 items-center justify-center rounded border border-dashed border-hx-border text-center text-xs text-hx-grey">
            Sin camiseta cargada
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="hx-label text-xs font-medium">Roster</h3>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex justify-between text-hx-gold-bright">
            <span>{ROLE_LABELS[playerRole]}</span>
            <span className="font-semibold">{playerNick} (vos)</span>
          </li>
          {roster.map((slot) => (
            <li key={slot.role} className="flex justify-between text-hx-grey">
              <span>{ROLE_LABELS[slot.role]}</span>
              <span>{slot.nick}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LeagueTablePanel({
  teams,
  standings,
  playerTeam,
}: {
  teams: TeamDefinition[];
  standings: LeagueStanding[];
  playerTeam?: TeamDefinition;
}) {
  return (
    <section className="hx-panel flex h-full flex-col gap-3 rounded-xl p-4">
      <h2 className="hx-label text-xs font-medium">Posiciones de la liga</h2>
      <ol className="flex flex-col gap-1 text-sm">
        {standings.map((standing, i) => {
          const team = teams.find((t) => t.id === standing.teamId);
          if (!team) return null;
          const isPlayerTeam = team.id === playerTeam?.id;
          return (
            <li
              key={standing.teamId}
              className={`flex items-center gap-2 rounded px-2 py-1 ${
                isPlayerTeam ? "bg-hx-navy-light text-hx-gold-bright" : "text-hx-grey"
              }`}
            >
              <span className="w-5 shrink-0 text-right text-xs">{i + 1}</span>
              <TeamBadge team={team} size={24} />
              <span className="flex-1 truncate">{team.name}</span>
              <span className="text-xs">{standing.points}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Stat({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta?: number;
}) {
  return (
    <div className="hx-stat rounded-lg px-3 py-2">
      <div className="text-xs text-hx-grey">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-hx-gold-bright">
          {Math.round(value)}
        </span>
        {!!delta && (
          <span
            className={`text-xs font-bold ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {delta > 0 ? "▲" : "▼"}
          </span>
        )}
      </div>
    </div>
  );
}
