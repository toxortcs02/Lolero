import type { MaterializedEvent } from "@/types/game";
import type { TeamDefinition } from "@/content/teams";
import { getRivalTeamId } from "@/content/rivalries";
import { getLckSiblingId } from "@/content/orgSiblings";

/** Event ids resolved dynamically instead of looked up in the static catalog. */
export const DYNAMIC_TRANSFER_EVENT_IDS = [
  "transfer_rival_offer",
  "transfer_four_offers",
  "transfer_contract_end",
] as const;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildRivalOfferEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  const rivalId = getRivalTeamId(currentTeamId) ?? teams.find((t) => t.id !== currentTeamId)!.id;
  const rival = teams.find((t) => t.id === rivalId)!;

  return {
    id: "transfer_rival_offer",
    title: `Oferta de ${rival.name}`,
    description: `${rival.name}, tu rival histórico, te hace una oferta para la próxima temporada.`,
    choices: [
      {
        id: "accept",
        label: `Aceptar y ficharte por ${rival.name}`,
        relationEffects: { fanLoyalty: -12, prestige: 10 },
        targetTeamId: rival.id,
        displayTeamId: rival.id,
        offerStamp: "Traición",
        resolution: `Firmás con ${rival.name}. Las redes explotan de indignación, pero tu nombre suena más fuerte que nunca.`,
      },
      {
        id: "reject",
        label: "Rechazar y quedarte",
        relationEffects: { fanLoyalty: 8, teamTrust: 8, prestige: -5 },
        resolution: "Le decís que no. La hinchada te aplaude la lealtad y el vestuario respira tranquilo.",
      },
      {
        id: "leverage",
        label: "Usarla para negociar una mejora con tu equipo",
        relationEffects: { teamTrust: -6, prestige: 6 },
        resolution: "Conseguís mejores condiciones, pero el club nota la jugada y queda un poco de recelo.",
      },
      {
        id: "leak",
        label: "Filtrarla a la prensa para presionar",
        relationEffects: { teamTrust: -10, fanLoyalty: -4, prestige: 8 },
        resolution:
          "La filtración se vuelve tema de streams y podcasts. Ganás exposición, pero tu equipo no te lo perdona tan rápido.",
      },
    ],
  };
}

export function buildFourOffersEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  const rivalId = getRivalTeamId(currentTeamId);
  const others = teams.filter((t) => t.id !== currentTeamId && t.id !== rivalId);
  const byStrength = [...others].sort((a, b) => b.baseStrength - a.baseStrength);
  const bigClub = byStrength[0];
  const smallClub = byStrength[byStrength.length - 1];
  const rival = teams.find((t) => t.id === rivalId) ?? bigClub;

  return {
    id: "transfer_four_offers",
    title: "Ofertas de pases de varios equipos",
    description: `Recibís ofertas de ${bigClub.name}, ${smallClub.name} y de tu rival histórico ${rival.name}, además de la posibilidad de renovar con el actual.`,
    choices: [
      {
        id: "big_club",
        label: `Fichar por ${bigClub.name} (más grande, más presión, banco)`,
        relationEffects: { prestige: 20, mentalHealth: -8 },
        targetTeamId: bigClub.id,
        displayTeamId: bigClub.id,
        offerStamp: "Grande",
        resolution: `Elegís a ${bigClub.name}. Es un fichaje que suena en toda la región, pero ahí vas a tener que pelear cada minuto de cancha.`,
      },
      {
        id: "small_club",
        label: `Fichar por ${smallClub.name} (más chico, titular seguro)`,
        relationEffects: { fanLoyalty: 15, prestige: -5 },
        targetTeamId: smallClub.id,
        displayTeamId: smallClub.id,
        offerStamp: "Chico",
        resolution: `Elegís ${smallClub.name}, donde vas a ser indiscutido. La nueva hinchada te recibe con los brazos abiertos.`,
      },
      {
        id: "rival_club",
        label: `Fichar por tu rival histórico, ${rival.name}`,
        relationEffects: { prestige: 12, fanLoyalty: -18 },
        targetTeamId: rival.id,
        displayTeamId: rival.id,
        offerStamp: "Traición",
        resolution: `Cruzás a ${rival.name}, tu clásico rival. Es una bomba mediática, y tus viejos fans no te lo van a perdonar fácil.`,
      },
      {
        id: "renew",
        label: "Renovar con tu equipo actual",
        relationEffects: { fanLoyalty: 10, teamTrust: 15, prestige: -5 },
        displayTeamId: currentTeamId,
        offerStamp: "Renovación",
        resolution: "Te quedás donde estás. La continuidad tranquiliza al vestuario y a la hinchada.",
      },
      {
        id: "wait",
        label: "Tomarte tiempo para decidir (perdés todas las ofertas)",
        relationEffects: { prestige: -10, mentalHealth: 8 },
        resolution:
          "Te tomás demasiado tiempo pensando y las cuatro ofertas se enfrían. Al menos decidiste sin presión.",
      },
    ],
  };
}

export function buildContractEndEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  const others = shuffle(teams.filter((t) => t.id !== currentTeamId)).slice(0, 3);

  return {
    id: "transfer_contract_end",
    title: "Fin de contrato",
    description: `Tu contrato termina. ${others.map((t) => t.name).join(", ")} se muestran interesados, o podés renovar.`,
    choices: [
      {
        id: "renew_loyal",
        label: "Renovar por lealtad",
        relationEffects: { fanLoyalty: 15, teamTrust: 15, prestige: -8 },
        displayTeamId: currentTeamId,
        offerStamp: "Renovación",
        resolution:
          "Renovás sin pelear el número. El club y la hinchada te lo van a recordar por años.",
      },
      ...others.map((team, i) => ({
        id: `offer_${i}`,
        label: `Fichar por ${team.name}`,
        relationEffects: { prestige: 8, fanLoyalty: -5 },
        targetTeamId: team.id,
        displayTeamId: team.id,
        offerStamp: "Oferta",
        resolution: `Fichás por ${team.name}. Empieza un capítulo nuevo, lejos de la gente que te vio crecer.`,
      })),
      {
        id: "retire",
        label: "Retirarte",
        relationEffects: {},
        resolution: "Colgás los guantes de mouse. Tu carrera profesional termina acá, por decisión propia.",
        endsCareer: true,
      },
    ],
  };
}

/**
 * Primer evento de toda carrera (season 1, slot 0) — el equipo ya está
 * asignado (se sorteó en /crear), así que esto es pura bienvenida, nunca un
 * "mercado de pases": todavía no jugaste en ningún lado, no hay de dónde
 * transferirte. Dos variantes según si arrancaste prodigio (LCK) o normal
 * (Challengers). Ver isCareerDebut en careerStore.advance().
 */
export function buildDebutEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  const team = teams.find((t) => t.id === currentTeamId);
  const isLck = team?.league === "lck";
  const teamName = team?.name ?? "tu nuevo equipo";

  return {
    id: "career_debut",
    title: isLck ? "🌟 Te llueven ofertas" : "Arrancás tu carrera",
    description: isLck
      ? `Te llueven ofertas por tu gran talento para estar en la principal categoría de tu región. Firmás con ${teamName}.`
      : `Te ofrecen unirte a la Liga Challengers de Corea. Firmás con ${teamName}.`,
    choices: [
      {
        id: "humble",
        label: "Aceptar con humildad, con ganas de demostrar",
        relationEffects: { teamTrust: 10, fanLoyalty: 8 },
        resolution: "Llegás con los pies en la tierra. El vestuario te recibe bien desde el primer día.",
      },
      {
        id: "confident",
        label: "Aceptar con confianza, sabés lo que valés",
        relationEffects: { prestige: 8, teamTrust: -5 },
        resolution: "Llegás mostrando seguridad. Algunos lo respetan, otros esperan que se lo demuestres en la Rift.",
      },
    ],
  };
}

/**
 * Ascenso a LCK — a diferencia de los tres de arriba, estos no se sortean
 * por categoría: careerStore.advance() los dispara explícitamente cuando se
 * cumple la condición (ver diseño en careerStore.ts), y siempre reciben la
 * lista completa de equipos (para poder filtrar la LCK ellos mismos).
 */

/** Overall >= 70 en Challengers: ofertas de un puñado de clubes de LCK. */
export function buildTier1OffersEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  const lckTeams = teams.filter((t) => t.league === "lck");
  const byStrength = [...lckTeams].sort((a, b) => b.baseStrength - a.baseStrength);
  const topClub = byStrength[0];
  const midClub = byStrength[Math.floor(byStrength.length / 2)];
  const otherPool = lckTeams.filter((t) => t.id !== topClub.id && t.id !== midClub.id);
  const wildcard = otherPool[Math.floor(Math.random() * otherPool.length)] ?? midClub;

  return {
    id: "tier1_offers",
    title: "🌟 La LCK te tiene en la mira",
    description:
      "Tu nivel no pasó desapercibido: varios equipos de la primera división te hacen llegar ofertas para la próxima temporada.",
    choices: [
      {
        id: "top",
        label: `Fichar por ${topClub.name} (el más grande, presión máxima)`,
        relationEffects: { prestige: 22, mentalHealth: -10 },
        targetTeamId: topClub.id,
        displayTeamId: topClub.id,
        offerStamp: "Bombazo",
        resolution: `Firmás con ${topClub.name}. Pasás de Challengers a estar bajo los reflectores de toda la región de un salto.`,
      },
      {
        id: "mid",
        label: `Fichar por ${midClub.name}`,
        relationEffects: { prestige: 16, fanLoyalty: -5 },
        targetTeamId: midClub.id,
        displayTeamId: midClub.id,
        offerStamp: "LCK",
        resolution: `Firmás con ${midClub.name}. Debutás en primera sin la presión de ser la cara del equipo.`,
      },
      {
        id: "wildcard",
        label: `Fichar por ${wildcard.name}`,
        relationEffects: { prestige: 14, fanLoyalty: 5 },
        targetTeamId: wildcard.id,
        displayTeamId: wildcard.id,
        offerStamp: "LCK",
        resolution: `Firmás con ${wildcard.name}. No es el fichaje más ruidoso, pero es tu lugar en la LCK.`,
      },
      {
        id: "stay",
        label: "Rechazar todo y seguir en Challengers",
        relationEffects: { teamTrust: 10, fanLoyalty: 10, prestige: -8 },
        resolution: "Preferís seguir creciendo en Challengers antes de dar el salto. Tu equipo actual valora la lealtad.",
      },
    ],
  };
}

/** 5% de probabilidad, edad >= 18, overall >= 60: tu propia organización te sube. */
export function buildAcademyCallupEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent | null {
  const siblingId = getLckSiblingId(currentTeamId);
  const sibling = teams.find((t) => t.id === siblingId);
  if (!sibling) return null;

  return {
    id: "lck_callup",
    title: "Llamado al roster principal",
    description: `${sibling.name} evalúa subirte del equipo Academy al roster titular de la LCK.`,
    choices: [
      {
        id: "accept",
        label: "Aceptar de inmediato",
        relationEffects: { prestige: 20, teamTrust: 10, mentalHealth: -8 },
        targetTeamId: sibling.id,
        displayTeamId: sibling.id,
        offerStamp: "Ascenso",
        resolution: `Subís al roster principal de ${sibling.name}. Es el salto que soñabas, pero la presión del primer equipo pega fuerte desde el día uno.`,
      },
      {
        id: "guarantees",
        label: "Pedir garantías de minutos antes de aceptar",
        relationEffects: { prestige: 10, teamTrust: -8 },
        targetTeamId: sibling.id,
        displayTeamId: sibling.id,
        offerStamp: "Ascenso",
        resolution: "Negociás minutos garantizados. El management valora tu cabeza fría, aunque la conversación se sintió incómoda.",
      },
      {
        id: "negotiate_salary",
        label: "Negociar mejor salario antes de subir",
        relationEffects: { prestige: 12, teamTrust: -12 },
        targetTeamId: sibling.id,
        displayTeamId: sibling.id,
        offerStamp: "Ascenso",
        resolution: "Conseguís el número que querías, pero arrancar el nuevo capítulo negociando plata deja mal sabor en la organización.",
      },
      {
        id: "decline",
        label: "Rechazar y quedarte donde sos titular",
        relationEffects: { fanLoyalty: 15, teamTrust: 10, prestige: -10 },
        resolution: "Preferís seguir siendo titular en Challengers. La afición local te idolatra por elegirlos a ellos.",
      },
    ],
  };
}

/** Terminaste 1° en la tabla de Challengers: ofertas de los diez equipos de LCK. */
export function buildLeagueChampionOffersEvent(
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  const lckTeams = shuffle(teams.filter((t) => t.league === "lck"));

  return {
    id: "league_champion_offers",
    title: "🏆 Terminaste primero — toda la LCK te llama",
    description: "Saliste campeón de Challengers. Los diez equipos de la LCK se pelean por tu firma.",
    choices: [
      ...lckTeams.map((team, i) => ({
        id: `lck_offer_${i}`,
        label: `Fichar por ${team.name}`,
        relationEffects: { prestige: 18, fanLoyalty: -8 },
        targetTeamId: team.id,
        displayTeamId: team.id,
        offerStamp: team.baseStrength >= 9 ? "Bombazo" : "LCK",
        resolution: `Firmás con ${team.name}. Toda la comunidad habla de vos.`,
      })),
      {
        id: "stay",
        label: "Rechazar todo y seguir en Challengers",
        relationEffects: { teamTrust: 15, fanLoyalty: 15, prestige: -10 },
        resolution: "A pesar del interés de toda la LCK, decidís seguir un año más en Challengers.",
      },
    ],
  };
}

export function buildDynamicTransferEvent(
  eventId: (typeof DYNAMIC_TRANSFER_EVENT_IDS)[number],
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  // Offers never cross leagues — a Challengers rookie only ever sees other
  // Challengers clubs, never an LCK org (and vice versa, once promotion is wired up).
  const currentLeague = teams.find((t) => t.id === currentTeamId)?.league ?? "challengers";
  const pool = teams.filter((t) => t.league === currentLeague);

  switch (eventId) {
    case "transfer_rival_offer":
      return buildRivalOfferEvent(pool, currentTeamId);
    case "transfer_four_offers":
      return buildFourOffersEvent(pool, currentTeamId);
    case "transfer_contract_end":
      return buildContractEndEvent(pool, currentTeamId);
  }
}
