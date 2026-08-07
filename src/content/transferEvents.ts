import type { MaterializedEvent } from "@/types/game";
import type { TeamDefinition } from "@/content/teams";
import { getRivalTeamId } from "@/content/rivalries";

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
        resolution: `Elegís a ${bigClub.name}. Es un fichaje que suena en toda la región, pero ahí vas a tener que pelear cada minuto de cancha.`,
      },
      {
        id: "small_club",
        label: `Fichar por ${smallClub.name} (más chico, titular seguro)`,
        relationEffects: { fanLoyalty: 15, prestige: -5 },
        targetTeamId: smallClub.id,
        resolution: `Elegís ${smallClub.name}, donde vas a ser indiscutido. La nueva hinchada te recibe con los brazos abiertos.`,
      },
      {
        id: "rival_club",
        label: `Fichar por tu rival histórico, ${rival.name}`,
        relationEffects: { prestige: 12, fanLoyalty: -18 },
        targetTeamId: rival.id,
        resolution: `Cruzás a ${rival.name}, tu clásico rival. Es una bomba mediática, y tus viejos fans no te lo van a perdonar fácil.`,
      },
      {
        id: "renew",
        label: "Renovar con tu equipo actual",
        relationEffects: { fanLoyalty: 10, teamTrust: 15, prestige: -5 },
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
        resolution:
          "Renovás sin pelear el número. El club y la hinchada te lo van a recordar por años.",
      },
      ...others.map((team, i) => ({
        id: `offer_${i}`,
        label: `Fichar por ${team.name}`,
        relationEffects: { prestige: 8, fanLoyalty: -5 },
        targetTeamId: team.id,
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

export function buildDynamicTransferEvent(
  eventId: (typeof DYNAMIC_TRANSFER_EVENT_IDS)[number],
  teams: TeamDefinition[],
  currentTeamId: string,
): MaterializedEvent {
  switch (eventId) {
    case "transfer_rival_offer":
      return buildRivalOfferEvent(teams, currentTeamId);
    case "transfer_four_offers":
      return buildFourOffersEvent(teams, currentTeamId);
    case "transfer_contract_end":
      return buildContractEndEvent(teams, currentTeamId);
  }
}
