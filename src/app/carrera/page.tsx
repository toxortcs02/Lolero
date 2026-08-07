"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { useTeams } from "@/hooks/useTeams";
import { useEvents } from "@/hooks/useEvents";
import { ROLE_LABELS } from "@/content/roles";
import {
  ATTRIBUTE_LABELS,
  GENERAL_ATTRIBUTES,
  getOverall,
  ROLE_SPECIAL_ATTRIBUTES,
} from "@/content/attributes";
import { PHASE_LABELS, TOURNAMENT_LABELS } from "@/content/seasonPlan";
import { getApodo } from "@/content/apodos";
import { getFictionalOffer } from "@/content/offerFlavor";
import { getBarColor, getLolRank } from "@/content/relationBars";
import { TeamBadge } from "@/components/TeamBadge";
import type { TeamDefinition } from "@/content/teams";
import type { LeagueStanding, MaterializedChoice, Relations, Role, RosterSlot } from "@/types/game";

const RELATION_LABELS: Record<keyof Relations, string> = {
  teamTrust: "Confianza equipo",
  fanLoyalty: "Fidelidad fans",
  prestige: "Prestigio",
  mentalHealth: "Salud mental",
};

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
  const events = useCareerStore((s) => s.events);
  const teams = useTeams();
  useEvents();

  useEffect(() => {
    if (!character) {
      router.replace("/crear");
      return;
    }
    if (status === "retired") {
      router.replace("/retiro");
      return;
    }
  }, [character, status, router]);

  if (!character) return null;

  const team = teams.find((t) => t.name === character.team);
  const currentEvent = materializedEvent ?? events.find((e) => e.id === currentEventId);
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
  // Sinergia de equipo y consistencia se ocultan del panel (siguen contando para el overall).
  const visibleGeneralIds = generalIds.filter(
    (id) => id !== "teamSynergy" && id !== "consistency",
  );
  const overall = getOverall(attributes, character.role);
  const apodo = getApodo(character.nick);
  const yearsPlaying = season;

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-6 py-10">
      {/* Equipo pegado al borde real de la pantalla — posiciones ídem del otro lado — nada de esto depende del ancho del centro */}
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-6">
        {team && (
          <TeamRosterPanel
            team={team}
            playerNick={character.nick}
            playerRole={character.role}
            roster={roster}
          />
        )}

        {/* Columna central: ancho propio (max-w-4xl), centrada entre equipo y posiciones — stats y eventos editables por separado adentro */}
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3">
        {/* Panel fijo: info + stats, siempre visible */}
        <section className="hx-panel flex min-h-[280px] flex-col gap-3 rounded-xl p-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="hx-badge rounded-md px-2 py-0.5 text-sm font-bold">
                {overall}
              </span>
              <h1 className="hx-title text-lg font-bold">{character.nick}</h1>
              <span className="text-xs italic text-hx-grey">&ldquo;{apodo}&rdquo;</span>
            </div>
            <p className="text-xs text-hx-grey">
              {character.team} · {ROLE_LABELS[character.role]}
            </p>
            <p className="text-xs text-hx-grey">
              {character.age} años · {yearsPlaying} temporadas jugadas · Temporada {season}
              {phaseTag ? ` · ${phaseTag}` : ""}
            </p>
          </div>

          <div className="hx-divider" />

          <div className="flex flex-col gap-2">
            <h2 className="hx-label text-xs font-medium">Relaciones</h2>
            <RelationBar
              label="Fanatismo"
              value={relations.fanLoyalty}
              delta={lastEffects?.relations.fanLoyalty}
              showRank
            />
            <RelationBar
              label="Salud mental"
              value={relations.mentalHealth}
              delta={lastEffects?.relations.mentalHealth}
            />
          </div>

          <div className="hx-divider" />

          <div className="flex flex-col gap-1.5">
            <h2 className="hx-label text-xs font-medium">Atributos</h2>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {visibleGeneralIds.map((id) => (
                <Stat
                  key={id}
                  label={ATTRIBUTE_LABELS[id]}
                  value={attributes[id] ?? 0}
                  delta={lastEffects?.attributes[id]}
                />
              ))}
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
        <section className="hx-panel min-h-400px min-w-600px flex flex-col gap-4 rounded-xl p-6 sm:p-8">
          {currentEvent ? (
            <>
              <div className="flex flex-col gap-2">
                {phaseTag && (
                  <span className="hx-badge w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    {phaseTag}
                  </span>
                )}
                <h2 className="hx-title text-2xl font-bold sm:text-3xl">{currentEvent.title}</h2>
                <p className="text-base leading-relaxed text-hx-grey">{currentEvent.description}</p>
              </div>
              {currentEvent.choices.some((c) => "displayTeamId" in c && c.displayTeamId) ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {currentEvent.choices.map((choice) => {
                    const displayTeamId = "displayTeamId" in choice ? choice.displayTeamId : undefined;
                    const offerTeam = displayTeamId ? teams.find((t) => t.id === displayTeamId) : undefined;
                    if (offerTeam && team) {
                      return (
                        <OfferCard
                          key={choice.id}
                          team={offerTeam}
                          currentTeam={team}
                          choice={choice as MaterializedChoice}
                          onSelect={() => handleChoice(choice.id)}
                        />
                      );
                    }
                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleChoice(choice.id)}
                        className="hx-choice rounded-lg px-4 py-3 text-left text-sm sm:col-span-2"
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:max-w-2xl">
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
              )}
            </>
          ) : lastResolution ? (
            <>
              <p className="text-base leading-relaxed text-hx-gold-bright">{lastResolution}</p>
              <button onClick={advance} className="hx-btn-primary self-start rounded-full px-6 py-3">
                Continuar
              </button>
            </>
          ) : (
            <>
              <button onClick={advance} className="hx-btn-primary self-start rounded-full px-6 py-3">
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
    <section className="hx-panel group flex min-h-[390px] w-full flex-col gap-3  rounded-xl p-4 lg:w-[260px] lg:flex-shrink-0">
      <h2 className="hx-label text-xs font-medium">Tu equipo</h2>

      <div className="flex flex-1 flex-col items-center justify-center gap-2  text-center">
        <div className="transition-transform duration-300 group-hover:scale-105">
          <TeamBadge team={team} size={80} />
        </div>
        <h3 className="hx-title text-base font-bold">{team.name}</h3>
        {team.jerseyUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded URL
          <img
            src={team.jerseyUrl}
            alt={`Camiseta de ${team.name}`}
            className="h-32 w-auto rounded border border-hx-border object-contain"
          />
        ) : (
          <div className="flex h-32 w-24 items-center justify-center rounded border border-dashed border-hx-border text-center text-xs text-hx-grey">
            Sin camiseta cargada
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="hx-label text-xs font-medium">Roster</h3>
        <ul className="flex flex-col gap-1.5 text-xs">
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
    <section className="hx-panel flex min-h-[390px] w-full flex-col gap-2 rounded-xl p-3 lg:w-[260px] lg:flex-shrink-0">
      <h2 className="hx-label text-xs font-medium">Posiciones de la liga</h2>
      <ol className="flex flex-col gap-1 text-s">
        {standings.map((standing, i) => {
          const team = teams.find((t) => t.id === standing.teamId);
          if (!team) return null;
          const isPlayerTeam = team.id === playerTeam?.id;
          return (
            <li
              key={standing.teamId}
              className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors duration-150 ${
                isPlayerTeam
                  ? "bg-hx-navy-light text-hx-gold-bright"
                  : "text-hx-grey hover:bg-white/[0.03] hover:text-hx-gold-bright"
              }`}
            >
              <span className="w-4 shrink-0 text-right text-[10px] hx-stat-value">{i + 1}</span>
              <TeamBadge team={team} size={20} />
              <span className="flex-1 truncate">{team.name}</span>
              <span className="hx-stat-value text-[15px]">{standing.points}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function OfferCard({
  team,
  currentTeam,
  choice,
  onSelect,
}: {
  team: TeamDefinition;
  currentTeam: TeamDefinition;
  choice: MaterializedChoice;
  onSelect: () => void;
}) {
  const offer = getFictionalOffer(team);
  const isMove = !!choice.targetTeamId;
  const strongerThanCurrent = team.baseStrength > currentTeam.baseStrength;
  const deltas = Object.entries(choice.relationEffects) as [keyof Relations, number][];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="hx-offer-card group relative flex flex-col overflow-hidden rounded-xl text-left transition hover:scale-[1.01]"
    >
      <div
        className="h-1.5 w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }}
      />
      <div className="relative flex flex-1 flex-col gap-2 p-3">
        <div className="pointer-events-none absolute -right-3 -top-3 opacity-[0.08]">
          <TeamBadge team={team} size={100} />
        </div>

        {choice.offerStamp && (
          <span className="hx-badge absolute right-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
            {choice.offerStamp}
          </span>
        )}

        <div className="relative flex items-center gap-2 pr-14">
          <TeamBadge team={team} size={32} />
          <div className="min-w-0 flex-1">
            <p className="hx-title truncate text-sm font-bold leading-tight">{team.name}</p>
            <p className="text-[10px] font-bold text-hx-grey">Fuerza {team.baseStrength}/10</p>
          </div>
        </div>

        <p className="relative">
          <span className="hx-stat-value text-lg font-bold text-hx-gold-bright">
            US$ {offer.monthlyK}K
          </span>
          <span className="text-[10px] font-bold text-hx-grey"> /mes · {offer.years} años</span>
        </p>

        {isMove && (
          <p
            className={`relative text-[10px] font-black leading-tight ${
              strongerThanCurrent ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {strongerThanCurrent ? "⚔️ Vas a pelear el puesto" : "🔒 Titular asegurado"}
          </p>
        )}

        {deltas.length > 0 && (
          <div className="relative mt-auto flex flex-wrap gap-1 pt-1">
            {deltas.map(([key, value]) => (
              <span
                key={key}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  value > 0
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "bg-red-400/10 text-red-400"
                }`}
              >
                {RELATION_LABELS[key]} {value > 0 ? "▲" : "▼"}
                {Math.abs(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
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
    <div className="hx-stat flex flex-col gap-0.5 rounded-lg px-2 py-1.5">
      <div className="hx-label text-[9px] font-medium">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="hx-stat-value text-base font-semibold text-hx-gold-bright">
          {Math.round(value)}
        </span>
        {!!delta && (
          <span
            className={`rounded px-1 py-0.5 text-[10px] font-bold ${
              delta > 0
                ? "bg-emerald-400/10 text-emerald-400"
                : "bg-red-400/10 text-red-400"
            }`}
          >
            {delta > 0 ? "▲" : "▼"}
            {Math.abs(Math.round(delta))}
          </span>
        )}
      </div>
    </div>
  );
}

function RelationBar({
  label,
  value,
  delta,
  showRank,
}: {
  label: string;
  value: number;
  delta?: number;
  showRank?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getBarColor(clamped);
  const rank = showRank ? getLolRank(clamped) : null;

  return (
    <div className="hx-stat flex flex-col gap-1 rounded-lg px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="hx-label text-[10px] font-medium">{label}</span>
        <span className="flex items-baseline gap-1.5">
          {rank && (
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
              {rank}
            </span>
          )}
          <span className="hx-stat-value text-xs font-semibold text-hx-gold-bright">
            {Math.round(clamped)}
          </span>
          {!!delta && (
            <span
              className={`rounded px-1 py-0.5 text-[10px] font-bold ${
                delta > 0
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-red-400/10 text-red-400"
              }`}
            >
              {delta > 0 ? "▲" : "▼"}
              {Math.abs(Math.round(delta))}
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-hx-border bg-black/40">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, black), ${color})`,
          }}
        />
      </div>
    </div>
  );
}
