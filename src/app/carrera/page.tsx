"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { isPositiveResult } from "@/content/matchSim";
import { getApodo } from "@/content/apodos";
import { getFictionalOffer } from "@/content/offerFlavor";
import { getBarColor, getLolRank } from "@/content/relationBars";
import { TeamBadge } from "@/components/TeamBadge";
import type { TeamDefinition } from "@/content/teams";
import type {
  LeagueStanding,
  MaterializedChoice,
  Phase,
  PhaseSlot,
  Relations,
  Role,
  RosterSlot,
  TournamentTier,
  YearSummary,
} from "@/types/game";

const RELATION_LABELS: Record<keyof Relations, string> = {
  teamTrust: "Confianza equipo",
  fanLoyalty: "Fidelidad fans",
  prestige: "Prestigio",
  mentalHealth: "Moral",
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
  const careerStats = useCareerStore((s) => s.careerStats);
  const yearSummary = useCareerStore((s) => s.yearSummary);
  const lastMatchResult = useCareerStore((s) => s.lastMatchResult);
  const coachName = useCareerStore((s) => s.coachName);
  const contract = useCareerStore((s) => s.contract);
  const ladder = useCareerStore((s) => s.ladder);
  const savings = useCareerStore((s) => s.savings);
  const teams = useTeams();
  useEvents();
  const [rolling, setRolling] = useState(false);

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
    if (rolling) return;
    const endsCareer = currentEvent?.choices.find((c) => c.id === choiceId)
      ?.endsCareer;
    setRolling(true);
    window.setTimeout(() => {
      resolveEventChoice(choiceId);
      setRolling(false);
      if (endsCareer) router.push("/retiro");
    }, 900);
  }

  // Sinergia de equipo y consistencia se ocultan del panel (siguen contando para el overall).
  const generalIds = GENERAL_ATTRIBUTES.map((a) => a.id).filter(
    (id) => id !== "teamSynergy" && id !== "consistency",
  );
  const roleIds = ROLE_SPECIAL_ATTRIBUTES[character.role];
  const overall = getOverall(attributes, character.role);
  const apodo = getApodo(character.nick);
  const yearsPlaying = season;

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-6 py-10">
      {/* Equipo pegado al borde real de la pantalla — posiciones ídem del otro lado — nada de esto depende del ancho NI del alto del centro (items-start: cada columna mide su propio contenido) */}
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
        {team && (
          <TeamRosterPanel
            team={team}
            playerNick={character.nick}
            playerRole={character.role}
            roster={roster}
            coachName={coachName}
            teamTrust={relations.teamTrust}
            careerStats={careerStats}
            contract={contract}
            ladder={ladder}
            splitsPlayed={season}
            savings={savings}
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
              {character.age} años · {yearsPlaying} temporadas jugadas
            </p>
          </div>

          <SeasonProgressBar season={season} slotIndex={slotIndex} planLength={yearPlan.length} currentSlot={currentSlot} phaseTag={phaseTag} />

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
              label="Moral"
              value={relations.mentalHealth}
              delta={lastEffects?.relations.mentalHealth}
            />
          </div>

          <div className="hx-divider" />

          <div className="flex flex-col gap-1.5">
            <h2 className="hx-label text-xs font-medium">Atributos</h2>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {generalIds.map((id) => (
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
        <section className="hx-panel flex min-h-[400px] flex-col gap-4 rounded-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {rolling ? (
              <motion.div
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 flex-col"
              >
                <HextechBoxLoader />
              </motion.div>
            ) : yearSummary ? (
              <motion.div
                key={`year-summary-${yearSummary.season}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col"
              >
                <YearSummaryPanel
                  summary={yearSummary}
                  careerStats={careerStats}
                  team={team}
                  overall={overall}
                  onContinue={advance}
                />
              </motion.div>
            ) : currentEvent ? (
              <motion.div
                key={`event-${currentEvent.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col gap-4"
              >
                <div className="flex flex-col gap-3">
                  {phaseTag && (
                    <span className="hx-badge w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                      {phaseTag}
                    </span>
                  )}
                  <h2 className="hx-title text-3xl font-bold sm:text-4xl">{currentEvent.title}</h2>
                  <p className="text-lg font-medium leading-relaxed text-hx-gold-bright/90">
                    {currentEvent.description}
                  </p>
                </div>
                {currentEvent.choices.some((c) => "displayTeamId" in c && c.displayTeamId) ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {currentEvent.choices.map((choice, i) => {
                      const displayTeamId = "displayTeamId" in choice ? choice.displayTeamId : undefined;
                      const offerTeam = displayTeamId ? teams.find((t) => t.id === displayTeamId) : undefined;
                      if (offerTeam && team) {
                        return (
                          <OfferCard
                            key={choice.id}
                            index={i}
                            team={offerTeam}
                            currentTeam={team}
                            choice={choice as MaterializedChoice}
                            onSelect={() => handleChoice(choice.id)}
                          />
                        );
                      }
                      return (
                        <motion.button
                          key={choice.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleChoice(choice.id)}
                          className="hx-choice rounded-lg px-4 py-4 text-left text-base font-semibold sm:col-span-2"
                        >
                          {choice.label}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <ChoiceGrid choices={currentEvent.choices} onSelect={handleChoice} />
                )}
              </motion.div>
            ) : lastResolution ? (
              <motion.div
                key="resolution"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col gap-4"
              >
                {lastMatchResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    className={`hx-badge w-fit rounded-lg px-5 py-3 text-xl font-bold ${
                      isPositiveResult(lastMatchResult)
                        ? "!border-emerald-400/50 !bg-emerald-400/10 !text-emerald-400"
                        : "!border-red-400/50 !bg-red-400/10 !text-red-400"
                    }`}
                  >
                    {lastMatchResult.gamesPlayed > 1
                      ? `${isPositiveResult(lastMatchResult) ? "📈" : "📉"} ${lastMatchResult.wins}-${lastMatchResult.losses} en el split`
                      : lastMatchResult.wins > 0
                        ? "🏆 Victoria"
                        : "💀 Derrota"}
                    {" · "}
                    {lastMatchResult.kills}/{lastMatchResult.deaths}/{lastMatchResult.assists} KDA
                  </motion.div>
                )}
                <p className="text-xl font-semibold leading-relaxed text-hx-gold-bright">{lastResolution}</p>
                {lastEffects && <EffectPills effects={lastEffects} />}
                <motion.button
                  onClick={advance}
                  whileTap={{ scale: 0.98 }}
                  className="hx-btn-primary mt-auto w-full rounded-lg py-4 text-base font-semibold"
                >
                  CONTINUAR
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col gap-4"
              >
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

                <motion.button
                  onClick={advance}
                  whileTap={{ scale: 0.98 }}
                  className="hx-btn-primary mt-auto w-full rounded-lg py-4 text-base font-bold"
                >
                  CONTINUAR
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        </div>

        <LeagueTablePanel teams={teams} standings={leagueStandings} playerTeam={team} />
      </div>
    </main>
  );
}

/** Colored pill per stat that changed on the last resolved choice — attributes
 *  and relations alike, including the ones hidden from the main panel (this
 *  is contextual, in-the-moment feedback, not a permanent stat display). */
function EffectPills({
  effects,
}: {
  effects: { attributes: Record<string, number>; relations: Record<string, number> };
}) {
  const entries = [
    ...Object.entries(effects.attributes ?? {}).map(([key, value]) => ({
      label: ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS] ?? key,
      value,
    })),
    ...Object.entries(effects.relations ?? {}).map(([key, value]) => ({
      label: RELATION_LABELS[key as keyof Relations] ?? key,
      value,
    })),
  ].filter((e) => e.value);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((e, i) => (
        <motion.span
          key={`${e.label}-${i}`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i }}
          className={`rounded px-3 py-1.5 text-sm font-bold ${
            e.value > 0 ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"
          }`}
        >
          {e.value > 0 ? "+" : ""}
          {Math.round(e.value)} {e.label}
        </motion.span>
      ))}
    </div>
  );
}

const PHASE_STEP_ORDER: Phase[] = ["pretemporada", "invierno", "verano"];
const PHASE_STEP_LABELS: Record<Phase, string> = {
  pretemporada: "Pretemporada",
  invierno: "Invierno",
  verano: "Verano",
};
/** Tournament checkpoints sit right after the phase they belong to, for
 *  highlighting purposes on the bar. */
const TOURNAMENT_PHASE: Record<TournamentTier, Phase> = {
  first_stand: "pretemporada",
  msi: "invierno",
  worlds: "verano",
};

function SeasonProgressBar({
  season,
  slotIndex,
  planLength,
  currentSlot,
  phaseTag,
}: {
  season: number;
  slotIndex: number;
  planLength: number;
  currentSlot: PhaseSlot | undefined;
  phaseTag: string | null;
}) {
  const activePhase: Phase | null = !currentSlot
    ? null
    : currentSlot.type === "event"
      ? currentSlot.phase
      : TOURNAMENT_PHASE[currentSlot.tier];
  const pct = planLength > 1 ? Math.max(0, Math.min(100, (slotIndex / (planLength - 1)) * 100)) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="hx-title text-4xl font-bold leading-none">Año {season}</span>
        {phaseTag && (
          <span className="hx-badge rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {phaseTag}
          </span>
        )}
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-hx-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-hx-gold-bright transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-hx-grey">
        {PHASE_STEP_ORDER.map((phase) => (
          <span key={phase} className={phase === activePhase ? "text-hx-gold-bright" : ""}>
            {PHASE_STEP_LABELS[phase]}
          </span>
        ))}
      </div>
    </div>
  );
}

function TeamRosterPanel({
  team,
  playerNick,
  playerRole,
  roster,
  coachName,
  teamTrust,
  careerStats,
  contract,
  ladder,
  splitsPlayed,
  savings,
}: {
  team: TeamDefinition;
  playerNick: string;
  playerRole: Role;
  roster: RosterSlot[];
  coachName: string;
  teamTrust: number;
  careerStats: CareerStatsShape;
  contract: { salaryPerYear: number; yearsRemaining: number };
  ladder: { tier: string; lp: number; rankPosition?: string; gamesThisSplit: number };
  splitsPlayed: number;
  savings: number;
}) {
  const form =
    careerStats.matchesWithCurrentTeam > 0
      ? formatWr(careerStats.winsWithCurrentTeam, careerStats.matchesWithCurrentTeam)
      : 50;

  return (
    <section className="hx-panel group flex min-h-[500px] min-w-[400px] w-full flex-col gap-3  rounded-xl p-4 lg:w-[260px] lg:flex-shrink-0">
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

      <div className="hx-divider" />

      <div className="flex flex-col gap-1.5">
        <h3 className="hx-label text-xs font-medium">Plantel</h3>
        <ul className="flex flex-col gap-1 text-xs text-hx-grey">
          <li className="flex justify-between">
            <span>Form</span>
            <span className="font-semibold text-hx-gold-bright">{form}</span>
          </li>
          <li className="flex justify-between">
            <span>Química con {team.tag}</span>
            <span className="font-semibold text-hx-gold-bright">{Math.round(teamTrust)}</span>
          </li>
          <li className="flex justify-between">
            <span>Coach</span>
            <span className="font-semibold text-hx-gold-bright">{coachName}</span>
          </li>
        </ul>
      </div>

      <div className="hx-divider" />

      <div className="flex flex-col gap-1.5">
        <h3 className="hx-label text-xs font-medium">Contrato</h3>
        <ul className="flex flex-col gap-1 text-xs text-hx-grey">
          <li className="flex justify-between">
            <span>Ahorros</span>
            <span className="font-semibold text-hx-gold-bright">
              €{savings.toLocaleString("es-AR")}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Salario</span>
            <span className="font-semibold text-hx-gold-bright">
              €{contract.salaryPerYear.toLocaleString("es-AR")} / año
            </span>
          </li>
          <li className="flex justify-between">
            <span>Restante</span>
            <span className="font-semibold text-hx-gold-bright">
              {contract.yearsRemaining} año{contract.yearsRemaining !== 1 ? "s" : ""}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Splits jugados</span>
            <span className="font-semibold text-hx-gold-bright">{splitsPlayed}</span>
          </li>
        </ul>
      </div>

      <div className="hx-divider" />

      <div className="flex flex-col gap-1.5">
        <h3 className="hx-label text-xs font-medium">Solo queue</h3>
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-hx-gold-bright">
            {ladder.tier} {ladder.lp} LP
          </span>
          {ladder.rankPosition && <span className="text-xs text-hx-grey">{ladder.rankPosition}</span>}
        </div>
        <p className="text-xs text-hx-grey">{ladder.gamesThisSplit} partidas en soloQ este split.</p>
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

/** Mini loader shown for ~900ms after picking a choice, to sell "resolving
 *  a random outcome" before the resolution text appears — a Hextech gem
 *  spinning/pulsing, matching the rest of the UI's aesthetic. */
function HextechBoxLoader() {
  const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
      <motion.div
        className="relative h-20 w-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            clipPath: hexClip,
            background: "linear-gradient(135deg, var(--color-hx-gold-bright), var(--color-hx-gold-dim))",
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-[3px]"
          style={{ clipPath: hexClip, background: "var(--color-hx-navy)" }}
        />
        <motion.div
          className="absolute inset-[10px]"
          style={{
            clipPath: hexClip,
            background: "linear-gradient(135deg, var(--color-hx-gold), transparent)",
          }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--color-hx-gold-bright)" }}
        animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <p className="hx-label text-xs">Resolviendo decisión…</p>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="hx-stat flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-center">
      <span className="hx-stat-value text-2xl font-bold text-hx-gold-bright">{value}</span>
      <span className="hx-label text-xs">{label}</span>
    </div>
  );
}

function formatKda(kills: number, deaths: number, assists: number): string {
  return deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2);
}

function formatWr(wins: number, matches: number): number {
  return matches > 0 ? Math.round((wins / matches) * 100) : 0;
}

interface CareerStatsShape {
  kills: number;
  deaths: number;
  assists: number;
  matchesPlayed: number;
  wins: number;
  titles: number;
  matchesWithCurrentTeam: number;
  winsWithCurrentTeam: number;
}

/** Shown when a season rolls over — recap of that year plus the career-to-date record,
 *  before the next year's first event loads (see yearSummary in careerStore.ts). */
function ObjectiveRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-hx-grey">{label}</span>
      <span
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded ${
          met ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"
        }`}
      >
        {met ? "✓" : "✕"}
      </span>
    </div>
  );
}

function YearSummaryPanel({
  summary,
  careerStats,
  team,
  overall,
  onContinue,
}: {
  summary: YearSummary;
  careerStats: CareerStatsShape;
  team?: TeamDefinition;
  overall: number;
  onContinue: () => void;
}) {
  const losses = summary.matchesPlayed - summary.wins;
  const madePlayoffs = summary.playoffStage !== "no_qualified";
  const netTotalClass = summary.earnings.total >= 0 ? "text-lime-500" : "text-red-400";

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="hx-label text-xs font-medium">
          Temporada {summary.season} — Split
        </span>
        <div className="flex items-center gap-2">
          <span className="hx-badge w-fit rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {summary.teamTier}
          </span>
          {team && <TeamBadge team={team} size={24} />}
          <span className="text-sm font-bold text-hx-gold-bright">{summary.teamName}</span>
        </div>
      </div>

      <p className="border-l-2 border-hx-gold pl-3 text-base italic leading-relaxed text-hx-grey">
        {summary.headline}
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="hx-label text-xs font-medium">Stats</h3>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-hx-grey">Partidos</span>
            <span className="font-semibold text-hx-gold-bright">{summary.matchesPlayed}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-hx-grey">KDA</span>
            <span className="font-semibold text-hx-gold-bright">
              {formatKda(summary.kills, summary.deaths, summary.assists)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-hx-grey">Rating</span>
            <span className="font-semibold text-hx-gold-bright">{overall}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="hx-label text-xs font-medium">Resultados</h3>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-hx-grey">Récord</span>
            <span className="font-semibold text-hx-gold-bright">
              {summary.wins}-{losses}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-hx-grey">Posición</span>
            <span className="font-semibold text-hx-gold-bright">
              {summary.standingPosition}° / {summary.totalTeams}
            </span>
          </div>
          <ObjectiveRow label="Playoffs" met={madePlayoffs} />
        </div>
      </div>

      <div className="hx-stat flex items-center justify-between gap-3 rounded-lg px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="hx-label text-[10px]">Ranking mundial</span>
          <span className="text-sm font-semibold text-hx-gold-bright">{summary.worldRankBucket}</span>
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-hx-grey">#{summary.worldRank}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="hx-label text-xs font-medium">Objetivo del club</h3>
        <ObjectiveRow label={summary.objective.label} met={summary.objective.met} />
      </div>

      <div className="hx-stat flex flex-col gap-1.5 rounded-lg p-4">
        <h3 className="hx-label text-xs font-medium">Ingresos de la temporada</h3>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-hx-grey">Salario</span>
          <span className="font-semibold text-hx-gold-bright">
            €{summary.earnings.salary.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-hx-grey">Sponsors</span>
          <span className="font-semibold text-hx-gold-bright">
            €{summary.earnings.sponsors.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-hx-grey">Bono por rendimiento</span>
          <span className="font-semibold text-hx-gold-bright">
            €{summary.earnings.bonus.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-hx-grey">Gastos de vida</span>
          <span className="font-semibold text-red-400">
            −€{Math.abs(summary.earnings.livingCosts).toLocaleString("es-AR")}
          </span>
        </div>
        <div className="hx-divider my-1" />
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-hx-grey">Total</span>
          <span className={`font-bold ${netTotalClass}`}>
            €{summary.earnings.total.toLocaleString("es-AR")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="hx-label text-xs font-medium">En el resto del mundo</h3>
        <p className="text-sm leading-relaxed text-hx-grey">{summary.elsewhereFlavor}</p>
      </div>

      <div className="hx-divider" />

      <div className="flex flex-col gap-2">
        <h3 className="hx-label text-xs font-medium">Carrera (total)</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <StatBlock
            label="KDA"
            value={formatKda(careerStats.kills, careerStats.deaths, careerStats.assists)}
          />
          <StatBlock label="Partidos" value={String(careerStats.matchesPlayed)} />
          <StatBlock label="WR%" value={`${formatWr(careerStats.wins, careerStats.matchesPlayed)}%`} />
          <StatBlock
            label="WR% equipo actual"
            value={`${formatWr(careerStats.winsWithCurrentTeam, careerStats.matchesWithCurrentTeam)}%`}
          />
          <StatBlock label="Títulos" value={String(careerStats.titles)} />
        </div>
      </div>

      <motion.button
        onClick={onContinue}
        whileTap={{ scale: 0.98 }}
        className="hx-btn-primary mt-auto w-full rounded-lg py-4 text-base font-bold"
      >
        CONTINUAR
      </motion.button>
    </div>
  );
}

/**
 * Up to 4 choices, laid out 2 per row with no gap between buttons — only
 * the corners on the outside of the whole block are rounded (the wrapper
 * clips to rounded-xl via overflow-hidden), inner shared edges get a
 * single 1px divider via inline border overrides (hx-choice's own CSS
 * border would otherwise double up / can't be beaten by border-* utility
 * classes, since our custom classes sit outside Tailwind's cascade layers).
 * 5+ choices fall back to a plain vertical stack.
 */
function ChoiceGrid({
  choices,
  onSelect,
}: {
  choices: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  if (choices.length > 4) {
    return (
      <div className="flex flex-col gap-2 sm:max-w-2xl">
        {choices.map((choice, i) => (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(choice.id)}
            className="hx-choice rounded-lg px-4 py-4 text-left text-base font-semibold"
          >
            {choice.label}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {choices.map((choice, i) => {
        const spansFullWidth = choices.length % 2 === 1 && i === choices.length - 1;

        return (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, zIndex: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(choice.id)}
            className={`hx-choice relative rounded-lg px-5 py-6 text-left text-base font-semibold ${spansFullWidth ? "col-span-2" : ""}`}
          >
            {choice.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function OfferCard({
  team,
  currentTeam,
  choice,
  onSelect,
  index = 0,
}: {
  team: TeamDefinition;
  currentTeam: TeamDefinition;
  choice: MaterializedChoice;
  onSelect: () => void;
  index?: number;
}) {
  const offer = getFictionalOffer(team);
  const isMove = !!choice.targetTeamId;
  const strongerThanCurrent = team.baseStrength > currentTeam.baseStrength;
  const deltas = Object.entries(choice.relationEffects) as [keyof Relations, number][];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="hx-offer-card group relative flex flex-col overflow-hidden rounded-xl text-left"
    >
      <div
        className="h-1.5 w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor})` }}
      />
      <div className="relative flex flex-1 flex-col gap-2.5 p-4">
        <div className="pointer-events-none absolute -right-3 -top-3 opacity-[0.08]">
          <TeamBadge team={team} size={100} />
        </div>

        {choice.offerStamp && (
          <span className="hx-badge absolute right-2 top-2 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide">
            {choice.offerStamp}
          </span>
        )}

        <div className="relative flex items-center gap-2 pr-14">
          <TeamBadge team={team} size={36} />
          <div className="min-w-0 flex-1">
            <p className="hx-title truncate text-base font-bold leading-tight">{team.name}</p>
            <p className="text-xs font-bold text-hx-grey">Fuerza {team.baseStrength}/10</p>
          </div>
        </div>

        <p className="relative">
          <span className="hx-stat-value text-2xl font-bold text-hx-gold-bright">
            US$ {offer.monthlyK}K
          </span>
          <span className="text-xs font-bold text-hx-grey"> /mes · {offer.years} años</span>
        </p>

        {isMove && (
          <p
            className={`relative text-xs font-black leading-tight ${
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
                className={`rounded px-2 py-1 text-xs font-bold ${
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
    </motion.button>
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
