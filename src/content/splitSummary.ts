import type { PlayoffStage } from "@/content/playoffs";
import type { TeamDefinition } from "@/content/teams";

function randomPick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Cosmetic global ranking — not tied to any other system, just overall + prestige. */
export function rollWorldRanking(overall: number, prestige: number): { rank: number; bucket: string } {
  const rank = Math.max(1, Math.round(5000 - overall * 40 - prestige * 10));
  const bucket =
    rank <= 10
      ? "Top 10 mundial"
      : rank <= 50
        ? "Top 50 mundial"
        : rank <= 300
          ? "Top 300 mundial"
          : "Fuera del top 300 mundial";
  return { rank, bucket };
}

export interface OrgObjective {
  label: string;
  met: boolean;
}

/** The org's ambition for the season scales with how strong it already is;
 *  "met" is checked against the playoff run that just happened. */
export function getOrgObjective(teamStrength: number, playoffStage: PlayoffStage): OrgObjective {
  if (teamStrength >= 8) {
    return { label: "Ser campeón", met: playoffStage === "champion" };
  }
  if (teamStrength >= 6) {
    return { label: "Llegar a la final", met: playoffStage === "final" || playoffStage === "champion" };
  }
  if (teamStrength >= 4) {
    return { label: "Clasificar a playoffs", met: playoffStage !== "no_qualified" };
  }
  return { label: "Sumar experiencia", met: true };
}

export interface SplitEarnings {
  salary: number;
  sponsors: number;
  bonus: number;
  livingCosts: number;
  total: number;
}

const PLAYOFF_BONUS_RATE: Record<PlayoffStage, number> = {
  no_qualified: 0,
  quarterfinals: 0.08,
  semifinals: 0.15,
  final: 0.25,
  champion: 0.4,
};

/** Breakdown behind the "Ahorros" that get banked at year-end — see careerStore.ts. */
export function computeSplitEarnings(
  salaryPerYear: number,
  fanLoyalty: number,
  playoffStage: PlayoffStage,
): SplitEarnings {
  const sponsors = Math.round(fanLoyalty * 5);
  const bonus = Math.round(salaryPerYear * PLAYOFF_BONUS_RATE[playoffStage]);
  const livingCosts = -Math.round(salaryPerYear * 0.2);
  return {
    salary: salaryPerYear,
    sponsors,
    bonus,
    livingCosts,
    total: salaryPerYear + sponsors + bonus + livingCosts,
  };
}

const HEADLINE_TEMPLATES = {
  champion: (nick: string, team: string) => `📰 "${nick} corona a ${team} como campeón de la temporada"`,
  goodRun: (nick: string, team: string) => `📰 "${nick} mete a ${team} de lleno en la conversación"`,
  average: (nick: string, team: string) => `📰 "${team} cierra una temporada sin sobresaltos con ${nick}"`,
  bad: (nick: string, team: string) => `📰 "Temporada para el olvido de ${nick} en ${team}"`,
};

export function pickHeadline(nick: string, teamName: string, playoffStage: PlayoffStage): string {
  if (playoffStage === "champion") return HEADLINE_TEMPLATES.champion(nick, teamName);
  if (playoffStage === "final" || playoffStage === "semifinals") return HEADLINE_TEMPLATES.goodRun(nick, teamName);
  if (playoffStage === "quarterfinals") return HEADLINE_TEMPLATES.average(nick, teamName);
  return HEADLINE_TEMPLATES.bad(nick, teamName);
}

const ELSEWHERE_FLAVOR = [
  "Un parche agresivo cambia el meta en todas las regiones a la vez.",
  "Se empieza a hablar de una posible expansión del circuito internacional.",
  "Un equipo histórico de LEC anuncia su venta a un fondo de inversión.",
  "Crecen los rumores de un mercado de pases movido en la offseason.",
  "La escena china domina las conversaciones tras un First Stand sorpresivo.",
];

export function pickElsewhereFlavor(): string {
  return randomPick(ELSEWHERE_FLAVOR);
}

export function tierLabelForTeam(team: TeamDefinition): string {
  return team.league === "lck" ? "LCK" : "LCK CHALLENGERS";
}
