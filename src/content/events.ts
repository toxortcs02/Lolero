import type { EventCategory, Relations, Role } from "@/types/game";
import type { GeneralAttributeId, SpecialAttributeId } from "@/content/attributes";

export type { EventCategory };

/** Narrative importance -> magnitude range used when writing effects below. */
export type EventTier = "minor" | "medium" | "major";
// minor  ±3-8   medium ±8-15   major ±15-25

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

export const EVENTS: EventDefinition[] = [
  // ── Transferencias y carrera ──────────────────────────────────────────
  // transfer_rival_offer, transfer_four_offers y transfer_contract_end
  // quedan acá solo para que pickEventId() los sortee por categoría — su
  // contenido real (nombres de equipos, efectos, resolución) se genera en
  // src/content/transferEvents.ts cuando se seleccionan. Ver careerStore.ts.
  {
    id: "transfer_rival_offer",
    category: "transfers",
    tier: "medium",
    title: "Oferta de otro equipo Challengers",
    description:
      "Un equipo rival de la misma región te hace una oferta para la próxima temporada.",
    choices: [
      {
        id: "accept",
        label: "Aceptar la oferta del rival",
        effects: { relations: { fanLoyalty: -12, prestige: 10 } },
        resolution:
          "Firmás con el rival. Las redes explotan de indignación, pero tu nombre suena más fuerte que nunca.",
      },
      {
        id: "reject",
        label: "Rechazar y quedarte",
        effects: { relations: { fanLoyalty: 8, teamTrust: 8, prestige: -5 } },
        resolution:
          "Le decís que no. La hinchada te aplaude la lealtad y el vestuario respira tranquilo.",
      },
      {
        id: "leverage",
        label: "Usarla para negociar una mejora con tu equipo",
        effects: { relations: { teamTrust: -6, prestige: 6 } },
        resolution:
          "Conseguís mejores condiciones, pero el club nota la jugada y queda un poco de recelo.",
      },
      {
        id: "leak",
        label: "Filtrarla a la prensa para presionar",
        effects: { relations: { teamTrust: -10, fanLoyalty: -4, prestige: 8 } },
        resolution:
          "La filtración se vuelve tema de streams y podcasts. Ganás exposición, pero tu equipo no te lo perdona tan rápido.",
      },
    ],
  },
  {
    id: "transfer_lck_callup",
    category: "transfers",
    tier: "major",
    title: "Llamado al roster principal LCK",
    description:
      "Tu organización evalúa subirte al roster titular de la LCK.",
    choices: [
      {
        id: "accept",
        label: "Aceptar de inmediato",
        effects: { relations: { prestige: 20, teamTrust: 10, mentalHealth: -8 } },
        resolution:
          "Subís al roster principal. Es el salto que soñabas, pero la presión del primer equipo pega fuerte desde el día uno.",
      },
      {
        id: "guarantees",
        label: "Pedir garantías de minutos antes de aceptar",
        effects: { relations: { prestige: 10, teamTrust: -8 } },
        resolution:
          "Negociás minutos garantizados. El management valora tu cabeza fría, aunque la conversación se sintió incómoda.",
      },
      {
        id: "decline",
        label: "Rechazar y quedarte donde sos titular",
        effects: { relations: { fanLoyalty: 15, teamTrust: 10, prestige: -10 } },
        resolution:
          "Preferís seguir siendo titular en Challengers. La afición local te idolatra por elegirlos a ellos.",
      },
      {
        id: "negotiate_salary",
        label: "Negociar mejor salario antes de subir",
        effects: { relations: { prestige: 12, teamTrust: -12 } },
        resolution:
          "Conseguís el número que querías, pero arrancar el nuevo capítulo negociando plata deja mal sabor en la organización.",
      },
    ],
  },
  {
    id: "transfer_foreign_offer",
    category: "transfers",
    tier: "major",
    title: "Oferta del extranjero",
    description:
      "Un equipo de otra región (LEC/LTA/LPL) ofrece llevarte fuera de Corea.",
    choices: [
      {
        id: "emigrate",
        label: "Emigrar",
        effects: { relations: { prestige: 18, fanLoyalty: -20, mentalHealth: -10 } },
        resolution:
          "Hacés las valijas. Tu carrera se internacionaliza, pero dejás atrás a la fanaticada que te vio debutar.",
      },
      {
        id: "stay",
        label: "Quedarte en Corea",
        effects: { relations: { fanLoyalty: 15, teamTrust: 10, prestige: -8 } },
        resolution:
          "Decidís seguir en la LCK. Los fans locales celebran que no los abandonaste.",
      },
      {
        id: "trial",
        label: "Pedir una prueba/trial antes de decidir",
        effects: { relations: { prestige: 8, teamTrust: -6 } },
        resolution:
          "Viajás a probarte sin comprometerte del todo. Genera ruido en tu equipo actual, que no sabe si contar con vos.",
      },
      {
        id: "leverage",
        label: "Usarla de palanca para renovar mejor en Corea",
        effects: { relations: { teamTrust: -8, prestige: 10 } },
        resolution:
          "Usás la oferta para mejorar tu contrato local. Te quedás, pero quedó claro que estuviste a un paso de irte.",
      },
    ],
  },
  {
    id: "transfer_rumor_leak",
    category: "transfers",
    tier: "minor",
    title: "Rumor de fichaje filtrado",
    description:
      "Se filtra en redes un rumor de fichaje tuyo antes de ser oficial.",
    choices: [
      {
        id: "deny",
        label: "Desmentirlo públicamente",
        effects: { relations: { teamTrust: 5, prestige: -3 } },
        resolution: "Salís a desmentirlo. Tu equipo lo agradece, aunque en redes quedan dudas.",
      },
      {
        id: "confirm",
        label: "Confirmarlo con confianza",
        effects: { relations: { prestige: 6, teamTrust: -6 } },
        resolution:
          "Confirmás el rumor antes de tiempo. Te ganás titulares, pero tu club no esperaba enterarse así.",
      },
      {
        id: "ignore",
        label: "Ignorarlo",
        effects: { relations: { mentalHealth: -4 } },
        resolution: "Preferís no responder. El silencio alimenta la especulación y te empieza a pesar.",
      },
    ],
  },
  {
    id: "transfer_contract_end",
    category: "transfers",
    tier: "major",
    title: "Fin de contrato",
    description:
      "Tu contrato termina: renovar, esperar mejor oferta o retirarte.",
    choices: [
      {
        id: "renew_loyal",
        label: "Renovar por lealtad",
        effects: { relations: { fanLoyalty: 15, teamTrust: 15, prestige: -8 } },
        resolution:
          "Renovás sin pelear el número. El club y la hinchada te lo van a recordar por años.",
      },
      {
        id: "wait_market",
        label: "Esperar una mejor oferta en el mercado",
        effects: { relations: { prestige: 10, teamTrust: -15 } },
        resolution:
          "Salís al mercado libre. Genera revuelo mediático, pero tu club se siente traicionado por la espera.",
      },
      {
        id: "retire",
        label: "Retirarte",
        effects: {},
        resolution: "Colgás los guantes de mouse. Tu carrera profesional termina acá, por decisión propia.",
        endsCareer: true,
      },
      {
        id: "demand_raise",
        label: "Exigir un aumento para renovar",
        effects: { relations: { teamTrust: -10, prestige: 8 } },
        resolution:
          "Plantás bandera y pedís más plata para seguir. Lo conseguís, pero la negociación dejó tensión.",
      },
    ],
  },
  {
    id: "transfer_four_offers",
    category: "transfers",
    tier: "major",
    title: "Ofertas de pases de 4 equipos",
    description:
      "Recibís ofertas de cuatro equipos distintos a la vez, además de la posibilidad de renovar con el actual.",
    choices: [
      {
        id: "big_club",
        label: "Fichar por el equipo más grande (más presión, banco)",
        effects: { relations: { prestige: 20, teamTrust: -10, mentalHealth: -8 } },
        resolution:
          "Elegís al gigante. Es un fichaje que suena en toda la región, pero ahí vas a tener que pelear cada minuto de cancha.",
      },
      {
        id: "small_club",
        label: "Fichar por un equipo chico (titular seguro)",
        effects: { relations: { fanLoyalty: 15, teamTrust: 15, prestige: -5 } },
        resolution:
          "Elegís un club chico donde vas a ser indiscutido. La nueva hinchada te recibe con los brazos abiertos.",
      },
      {
        id: "rival_club",
        label: "Fichar por el rival histórico",
        effects: { relations: { prestige: 12, fanLoyalty: -18 } },
        resolution:
          "Cruzás al clásico rival. Es una bomba mediática, y tus viejos fans no te lo van a perdonar fácil.",
      },
      {
        id: "renew",
        label: "Renovar con tu equipo actual",
        effects: { relations: { fanLoyalty: 10, teamTrust: 15, prestige: -5 } },
        resolution: "Te quedás donde estás. La continuidad tranquiliza al vestuario y a la hinchada.",
      },
      {
        id: "wait",
        label: "Tomarte tiempo para decidir (perdés todas las ofertas)",
        effects: { relations: { prestige: -10, mentalHealth: 8 } },
        resolution:
          "Te tomás demasiado tiempo pensando y las cuatro ofertas se enfrían. Al menos decidiste sin presión.",
      },
    ],
  },

  // ── Equipo y vestuario ─────────────────────────────────────────────────
  {
    id: "locker_coach_conflict",
    category: "locker_room",
    tier: "medium",
    title: "Conflicto con el coach",
    description:
      "El coach te cuestiona públicamente por decisiones tácticas en el último partido.",
    choices: [
      {
        id: "apologize",
        label: "Pedir disculpas públicamente",
        effects: { relations: { teamTrust: 10, prestige: -5 } },
        resolution: "Pedís disculpas frente a todos. El coach lo valora, aunque quedás algo expuesto.",
      },
      {
        id: "defend",
        label: "Defenderte públicamente",
        effects: { relations: { teamTrust: -10, prestige: 5, fanLoyalty: 5 } },
        resolution:
          "Salís a bancarte tu jugada en público. Los fans te bancan, pero el coach lo toma como una falta de respeto.",
      },
      {
        id: "private_talk",
        label: "Pedir hablarlo en privado",
        effects: { relations: { teamTrust: 6 } },
        resolution: "Hablan en privado y bajan los decibeles. El conflicto se resuelve sin escalar.",
      },
      {
        id: "go_over",
        label: "Saltar al manager por sobre el coach",
        effects: { relations: { teamTrust: -15, prestige: -3 } },
        resolution:
          "Vas directo al manager sin avisarle al coach. Lo resolvés, pero la confianza del cuerpo técnico queda rota.",
      },
    ],
  },
  {
    id: "locker_internal_competition",
    category: "locker_room",
    tier: "medium",
    title: "Competencia interna por el puesto titular",
    description:
      "Otro jugador de tu mismo rol pelea el puesto de titular con vos.",
    choices: [
      {
        id: "train_harder",
        label: "Entrenar el doble para asegurar el puesto",
        effects: { attributes: { consistency: 8 }, relations: { mentalHealth: -8 } },
        resolution:
          "Te metés horas extra de práctica. Te aseguras el puesto, pero llegás agotado a fin de mes.",
      },
      {
        id: "sabotage",
        label: "Sabotear sutilmente al rival interno",
        effects: { relations: { teamTrust: -12, prestige: 5 } },
        resolution:
          "Jugás sucio para sacarte de encima a tu competencia. Funciona, pero alguien en el vestuario se dio cuenta.",
      },
      {
        id: "talk_to_coach",
        label: "Hablarlo directamente con el coach",
        effects: { relations: { teamTrust: 8 } },
        resolution:
          "Vas de frente con el coach a plantear la situación. Se valora la madurez con la que lo manejaste.",
      },
      {
        id: "accept_bench",
        label: "Aceptar el banco sin pelear",
        effects: { relations: { teamTrust: 5, fanLoyalty: -8, mentalHealth: -5 } },
        resolution:
          "Te bajás del reclamo y aceptás rotar. El staff lo agradece, pero la gente empieza a preguntarse por qué no peleás tu lugar.",
      },
    ],
  },
  {
    id: "locker_blamed_by_teammate",
    category: "locker_room",
    tier: "medium",
    title: "Un compañero te culpa por la derrota",
    description:
      "Un compañero te acusa públicamente de ser responsable de una derrota clave.",
    choices: [
      {
        id: "confront",
        label: "Confrontarlo públicamente",
        effects: { relations: { teamTrust: -10, prestige: 3 } },
        resolution:
          "Le respondés en el momento, delante de todos. Queda claro que no te vas a dejar pisar, pero el clima del equipo se tensa.",
      },
      {
        id: "ignore",
        label: "Ignorarlo",
        effects: { relations: { mentalHealth: -6 } },
        resolution: "Preferís no responder. Puertas afuera parece que no pasó nada, pero te lo llevás puesto.",
      },
      {
        id: "private_talk",
        label: "Hablarlo en privado",
        effects: { relations: { teamTrust: 10 } },
        resolution: "Lo charlan a solas y se sacan las dudas. El equipo sale más unido de lo que estaba.",
      },
      {
        id: "blame_back",
        label: "Devolverle la acusación",
        effects: { relations: { teamTrust: -15, fanLoyalty: -5 } },
        resolution:
          "Le devolvés la acusación en el momento. Queda un round de cruces públicos que no le hace bien a nadie.",
      },
    ],
  },
  {
    id: "locker_igl_change",
    category: "locker_room",
    tier: "minor",
    title: "Cambio de shotcaller",
    description: "El equipo cambia de IGL/shotcaller a mitad de temporada.",
    choices: [
      {
        id: "accept",
        label: "Aceptar al nuevo IGL",
        effects: { relations: { teamTrust: 6 } },
        resolution: "Te adaptás sin problema al nuevo liderazgo. El equipo agradece la flexibilidad.",
      },
      {
        id: "request_igl",
        label: "Pedir ser vos el IGL",
        effects: { relations: { teamTrust: -6, prestige: 8 } },
        resolution:
          "Levantás la mano para tomar vos las calls. Genera algo de fricción, pero tu nombre empieza a sonar como líder.",
      },
      {
        id: "resist_quietly",
        label: "Resistirte en silencio",
        effects: { relations: { mentalHealth: -5, teamTrust: -4 } },
        resolution: "No decís nada, pero por dentro no estás de acuerdo. Se nota en tu juego.",
      },
    ],
  },
  {
    id: "locker_superstar_signing",
    category: "locker_room",
    tier: "medium",
    title: "Fichaje de una superestrella",
    description: "El equipo ficha a una superestrella que te saca protagonismo.",
    choices: [
      {
        id: "welcome",
        label: "Darle la bienvenida",
        effects: { relations: { teamTrust: 10, prestige: -5 } },
        resolution:
          "Recibís a la nueva figura con los brazos abiertos. El vestuario respira tranquilo, aunque quedás un paso atrás en los flashes.",
      },
      {
        id: "compete",
        label: "Competir por el protagonismo",
        effects: { attributes: { consistency: 5 }, relations: { teamTrust: -8, mentalHealth: -6 } },
        resolution:
          "Subís tu nivel para no quedar opacado. Rendís mejor, pero la convivencia con la nueva estrella se pone tensa.",
      },
      {
        id: "request_trade",
        label: "Pedir ser transferido",
        effects: { relations: { teamTrust: -10, prestige: 5 } },
        resolution:
          "Pedís salir antes de convertirte en suplente de lujo. El club no lo toma bien, pero tu decisión suena en el mercado.",
      },
      {
        id: "resent",
        label: "Guardarte el resentimiento",
        effects: { relations: { mentalHealth: -10 } },
        resolution: "No decís nada y te tragás la bronca. Puertas afuera todo sigue igual; por dentro, no tanto.",
      },
    ],
  },
  {
    id: "locker_roster_shuffle",
    category: "locker_room",
    tier: "minor",
    title: "Roster shuffle",
    description: "El equipo cambia 2-3 jugadores del roster de golpe.",
    choices: [
      {
        id: "embrace",
        label: "Aceptar el cambio con actitud positiva",
        effects: { relations: { teamTrust: 8 } },
        resolution: "Te subís al cambio de roster con buena onda. El nuevo grupo te toma como referente.",
      },
      {
        id: "stability_clause",
        label: "Pedir una cláusula de estabilidad",
        effects: { relations: { teamTrust: -5, prestige: 3 } },
        resolution:
          "Pedís garantías de que no te van a mover a vos también. El management lo anota, aunque no le encanta la desconfianza.",
      },
      {
        id: "consider_leaving",
        label: "Empezar a considerar irte",
        effects: { relations: { fanLoyalty: -8, prestige: 3 } },
        resolution: "Empezás a mirar el mercado por las dudas. Se filtra y la hinchada lo nota.",
      },
    ],
  },
  {
    id: "locker_analyst_tension",
    category: "locker_room",
    tier: "minor",
    title: "Tensión con el analista",
    description:
      "El analista de datos del equipo insiste en un overcoaching que no compartís.",
    choices: [
      {
        id: "comply",
        label: "Aceptar el overcoaching",
        effects: { attributes: { metaAdaptability: 5 }, relations: { mentalHealth: -5 } },
        resolution:
          "Seguís el plan al pie de la letra aunque no te convence del todo. Aprendés algo, a costa de tu paciencia.",
      },
      {
        id: "reject",
        label: "Rechazarlo",
        effects: { relations: { teamTrust: -8 } },
        resolution: "Le decís que no vas a jugar así. El analista lo toma como un portazo.",
      },
      {
        id: "middle_ground",
        label: "Buscar un término medio",
        effects: { relations: { teamTrust: 3 } },
        resolution: "Negocian un punto medio entre el plan y tu instinto. Todos quedan razonablemente conformes.",
      },
    ],
  },
  {
    id: "locker_betting_accusation",
    category: "locker_room",
    tier: "medium",
    title: "Acusación de apuestas online",
    description:
      "Un jugador del equipo es acusado de involucrarse en apuestas online, y salpica al vestuario.",
    choices: [
      {
        id: "report",
        label: "Reportarlo",
        effects: { relations: { teamTrust: 8, fanLoyalty: -5 } },
        resolution:
          "Lo reportás a la organización. Es lo correcto puertas adentro, pero una parte de la fanaticada lo lee como una traición al compañero.",
      },
      {
        id: "stay_silent",
        label: "Quedarte callado",
        effects: { relations: { mentalHealth: -8 } },
        resolution: "Preferís no meterte. Cargar con ese secreto te pesa más de lo que pensabas.",
      },
      {
        id: "defend_publicly",
        label: "Defenderlo públicamente",
        effects: { relations: { teamTrust: 5, prestige: -10 } },
        resolution:
          "Salís a bancar a tu compañero en público. El vestuario te lo agradece, pero tu imagen se ensucia con el escándalo.",
      },
      {
        id: "distance",
        label: "Distanciarte públicamente",
        effects: { relations: { prestige: 5, teamTrust: -10 } },
        resolution:
          "Te despegás públicamente del escándalo. Cuidás tu imagen, pero el vestuario lo siente como que los abandonaste.",
      },
    ],
  },
  {
    id: "locker_captain_request",
    category: "locker_room",
    tier: "medium",
    title: "Te piden ser capitán",
    description:
      "La organización te pide encabezar el roster como capitán la temporada siguiente.",
    choices: [
      {
        id: "accept",
        label: "Aceptar ser capitán",
        effects: { relations: { prestige: 15, mentalHealth: -8 } },
        resolution:
          "Aceptás el brazalete. Es un salto en tu carrera, pero ahora cada resultado pesa un poco más sobre tus hombros.",
      },
      {
        id: "decline",
        label: "Declinar",
        effects: { relations: { teamTrust: -5, mentalHealth: 5 } },
        resolution:
          "Preferís no cargar con esa responsabilidad todavía. El club respeta la decisión, aunque queda algo de duda.",
      },
    ],
  },

  // ── Mediático y público ──────────────────────────────────────────────
  {
    id: "media_sponsor_content",
    category: "media",
    tier: "medium",
    title: "El sponsor pide más contenido",
    description:
      "El sponsor pide que dediques más tiempo a streaming/contenido en vez de práctica.",
    choices: [
      {
        id: "comply_fully",
        label: "Cumplir totalmente",
        effects: { relations: { prestige: 12, mentalHealth: -10 } },
        resolution:
          "Le metés horas de stream además de las de práctica. Crece tu marca personal, pero el cansancio se acumula.",
      },
      {
        id: "negotiate_balance",
        label: "Negociar un balance",
        effects: { relations: { prestige: 5 } },
        resolution: "Encontrás un punto medio con el sponsor. Cumplís sin descuidar tanto la práctica.",
      },
      {
        id: "refuse",
        label: "Rechazarlo",
        effects: { relations: { prestige: -10, mentalHealth: 8 } },
        resolution: "Le decís que no. El sponsor no queda contento, pero tu cabeza te lo agradece.",
      },
      {
        id: "agent",
        label: "Pedir que tu agente intervenga",
        effects: { relations: { prestige: 3, teamTrust: -3 } },
        resolution: "Delegás la negociación en tu agente. Se resuelve, aunque tu equipo lo ve como poco directo.",
      },
    ],
  },
  {
    id: "media_postgame_interview",
    category: "media",
    tier: "minor",
    title: "Entrevista post-partido",
    description:
      "Tenés que responder preguntas incómodas en la entrevista post-partido: diplomacia o polémica.",
    choices: [
      {
        id: "diplomatic",
        label: "Respuesta diplomática",
        effects: { relations: { fanLoyalty: 3 } },
        resolution: "Contestás con cautela. Nadie se ofende, nadie se entusiasma demasiado.",
      },
      {
        id: "controversial",
        label: "Respuesta polémica",
        effects: { relations: { prestige: 8, teamTrust: -5 } },
        resolution:
          "Soltás una frase picante que se viraliza. Ganás repercusión, pero tu equipo prefiere el perfil bajo.",
      },
      {
        id: "humor",
        label: "Desviar con humor",
        effects: { relations: { fanLoyalty: 5 } },
        resolution: "Respondés con un chiste y la rompés en los clips. Los fans se ríen con vos.",
      },
      {
        id: "blame_rival",
        label: "Culpar al árbitro/rival",
        effects: { relations: { prestige: 5, fanLoyalty: -3 } },
        resolution: "Tirás la culpa para afuera. Genera ruido y no cae del todo bien puertas adentro.",
      },
    ],
  },
  {
    id: "media_viral_statement",
    category: "media",
    tier: "medium",
    title: "Declaraciones virales",
    description: "Algo que dijiste se viraliza de la peor manera posible.",
    choices: [
      {
        id: "apologize",
        label: "Disculparte",
        effects: { relations: { fanLoyalty: 5, prestige: -5 } },
        resolution: "Pedís disculpas públicamente. La ola de críticas baja, aunque quedás marcado por un tiempo.",
      },
      {
        id: "double_down",
        label: "Sostener lo dicho",
        effects: { relations: { prestige: 8, fanLoyalty: -10 } },
        resolution:
          "Te plantás en lo que dijiste. Una parte del público te respeta la firmeza, otra parte te da la espalda.",
      },
      {
        id: "ignore",
        label: "Ignorarlo",
        effects: { relations: { mentalHealth: -5 } },
        resolution: "Dejás que pase sin responder. La polémica se diluye sola, pero te queda dando vueltas en la cabeza.",
      },
      {
        id: "joke",
        label: "Desviar con una broma",
        effects: { relations: { fanLoyalty: 3, prestige: -2 } },
        resolution: "Le bajás el tono con humor. Funciona a medias, pero relaja el clima.",
      },
    ],
  },
  {
    id: "media_fans_pressure",
    category: "media",
    tier: "minor",
    title: "Presión de los fans",
    description:
      "Los fans piden públicamente que asumas más protagonismo en el equipo.",
    choices: [
      {
        id: "promise",
        label: "Prometer más protagonismo",
        effects: { relations: { fanLoyalty: 8, mentalHealth: -5 } },
        resolution: "Les prometés que vas a dar un paso al frente. Ahora tenés que sostenerlo.",
      },
      {
        id: "ignore",
        label: "Ignorarlo",
        effects: { relations: { fanLoyalty: -6 } },
        resolution: "No respondés al pedido. Los fans lo leen como desinterés.",
      },
      {
        id: "honest",
        label: "Ser honesto sobre tus límites",
        effects: { relations: { fanLoyalty: 3, teamTrust: 3 } },
        resolution:
          "Explicás con calma cuál es tu rol dentro del equipo. La sinceridad se aprecia más de lo que esperabas.",
      },
    ],
  },
  {
    id: "media_showmatch_invite",
    category: "media",
    tier: "minor",
    title: "Invitación a showmatch",
    description:
      "Te invitan a un evento/showmatch que interfiere con la semana de scrims.",
    choices: [
      {
        id: "accept",
        label: "Aceptar",
        effects: { relations: { prestige: 6, mentalHealth: -4 } },
        resolution: "Vas al showmatch. Suma visibilidad, pero te resta horas de preparación.",
      },
      {
        id: "decline",
        label: "Rechazar",
        effects: { relations: { prestige: -4, mentalHealth: 4 } },
        resolution: "Priorizás los scrims y rechazás la invitación. Menos ruido, más foco.",
      },
      {
        id: "negotiate",
        label: "Negociar el horario",
        effects: { relations: { prestige: 3 } },
        resolution: "Reacomodás el calendario para que entren las dos cosas. Se logra, con algo de malabarismo.",
      },
    ],
  },
  {
    id: "media_dating_scandal",
    category: "media",
    tier: "medium",
    title: "Escándalo: relación con una streamer/comentarista",
    description:
      "Se hace pública una relación tuya con una streamer/comentarista y genera revuelo mediático.",
    choices: [
      {
        id: "public_confident",
        label: "Hacerlo público con confianza",
        effects: { relations: { prestige: 8, fanLoyalty: -8 } },
        resolution:
          "Lo confirmás sin drama. Gana tracción mediática, aunque una parte de los fans se queja de la exposición.",
      },
      {
        id: "deny",
        label: "Negarlo",
        effects: { relations: { mentalHealth: -6 } },
        resolution: "Lo negás en público. Sostener la mentira te pesa más de lo que imaginabas.",
      },
      {
        id: "distance_quietly",
        label: "Distanciarte en silencio",
        effects: { relations: { mentalHealth: -4, fanLoyalty: 2 } },
        resolution: "Bajás el perfil y dejás que el tema se enfríe solo. Funciona, aunque no sin costo personal.",
      },
      {
        id: "use_for_marketing",
        label: "Usarlo para hacer marketing/prestigio",
        effects: { relations: { prestige: 12, teamTrust: -8 } },
        resolution:
          "Aprovechás el revuelo para contenido y prensa. Tu marca crece, pero al club no le cierra que lo uses así.",
      },
    ],
  },

  // ── Personal y salud ───────────────────────────────────────────────────
  {
    id: "personal_burnout",
    category: "personal",
    tier: "medium",
    title: "Burnout por bootcamp intensivo",
    description: "Un bootcamp intensivo te deja al límite físico y mental.",
    choices: [
      {
        id: "push_through",
        label: "Seguir a pesar del cansancio",
        effects: { attributes: { hands: 5 }, relations: { mentalHealth: -15 } },
        resolution:
          "Apretás los dientes y seguís entrenando. Las manos responden más finas, pero llegás al límite mental.",
      },
      {
        id: "ask_rest",
        label: "Pedir descanso",
        effects: { relations: { mentalHealth: 12, teamTrust: -5 } },
        resolution: "Pedís unos días libres. Volvés recargado, aunque al staff no le encantó frenar el plan.",
      },
      {
        id: "reduce_quietly",
        label: "Reducir horas en silencio",
        effects: { relations: { mentalHealth: 6, teamTrust: -8 } },
        resolution: "Bajás el ritmo sin avisar. Te alivia, pero el coach nota que algo cambió sin explicación.",
      },
    ],
  },
  {
    id: "personal_injury",
    category: "personal",
    tier: "medium",
    title: "Lesión física",
    description: "Dolor de muñeca o fatiga extrema por exceso de práctica.",
    choices: [
      {
        id: "play_hurt",
        label: "Jugar con dolor",
        effects: { attributes: { hands: -8 }, relations: { mentalHealth: -12 } },
        resolution:
          "Seguís jugando con la muñeca resentida. El dolor te condiciona la precisión en cada partida.",
      },
      {
        id: "rest",
        label: "Descansar y perder el puesto",
        effects: { relations: { mentalHealth: 10, teamTrust: -8 } },
        resolution: "Parás para recuperarte del todo. El cuerpo lo agradece, pero perdés la titularidad mientras tanto.",
      },
      {
        id: "treatment",
        label: "Buscar tratamiento y equilibrio",
        effects: { attributes: { hands: 3 }, relations: { mentalHealth: 5 } },
        resolution:
          "Encontrás un kinesiólogo y ajustás la rutina. La muñeca mejora sin tener que parar del todo.",
      },
    ],
  },
  {
    id: "personal_insomnia",
    category: "personal",
    tier: "minor",
    title: "Insomnio pre-playoffs",
    description: "La ansiedad previa a playoffs no te deja dormir bien.",
    choices: [
      {
        id: "therapist",
        label: "Ver a un psicólogo deportivo",
        effects: { relations: { mentalHealth: 10, teamTrust: -3 } },
        resolution:
          "Empezás terapia deportiva. Dormís mejor, aunque el staff se pregunta por qué no lo hablaste antes con ellos.",
      },
      {
        id: "tough_out",
        label: "Aguantar como sea",
        effects: { relations: { mentalHealth: -8 } },
        resolution: "Tratás de aguantar sin pedir ayuda. Las noches en vela se acumulan.",
      },
      {
        id: "quick_fix",
        label: "Recurrir a algo rápido para dormir",
        effects: { attributes: { hands: -3 }, relations: { mentalHealth: -5 } },
        resolution: "Recurrís a una solución rápida para dormir. Descansás, pero al otro día los reflejos no responden igual.",
      },
    ],
  },
  {
    id: "personal_balance_offer",
    category: "personal",
    tier: "medium",
    title: "Oferta de vida balanceada",
    description:
      "Te ofrecen un esquema de menos horas de práctica a cambio de menor sueldo.",
    choices: [
      {
        id: "accept",
        label: "Aceptar",
        effects: { relations: { mentalHealth: 15, prestige: -10 } },
        resolution: "Aceptás el esquema más liviano. Ganás en calidad de vida, perdés algo de perfil competitivo.",
      },
      {
        id: "decline",
        label: "Rechazar",
        effects: { relations: { mentalHealth: -8, prestige: 5 } },
        resolution: "Rechazás la propuesta y seguís al máximo ritmo. Tu ambición sigue intacta, tu cabeza no tanto.",
      },
    ],
  },
  {
    id: "personal_losing_streak",
    category: "personal",
    tier: "minor",
    title: "Pérdida de motivación",
    description:
      "Una racha larga de derrotas te deja sin motivación para seguir entrenando igual.",
    choices: [
      {
        id: "extra_practice",
        label: "Entrenar extra",
        effects: { attributes: { consistency: 5 }, relations: { mentalHealth: -6 } },
        resolution: "Redoblás la práctica para salir de la racha. Mejora el rendimiento, pero te cuesta la cabeza.",
      },
      {
        id: "take_break",
        label: "Tomarte un descanso",
        effects: { relations: { mentalHealth: 10, teamTrust: -5 } },
        resolution: "Frenás unos días para resetear. Volvés con otra cabeza, aunque el equipo prefería que sigas.",
      },
      {
        id: "talk_teammates",
        label: "Hablar con tus compañeros",
        effects: { relations: { teamTrust: 8 } },
        resolution: "Lo charlan en grupo y se banca entre todos. La racha pesa menos cuando la remás acompañado.",
      },
    ],
  },

  // ── Competitivo / meta ───────────────────────────────────────────────
  {
    id: "competitive_patch_change",
    category: "competitive",
    tier: "minor",
    title: "Cambio de parche",
    description: "Un parche nuevo rompe tu champion pool habitual.",
    choices: [
      {
        id: "adapt",
        label: "Adaptar tu pool",
        effects: { attributes: { metaAdaptability: 8 }, relations: { mentalHealth: -4 } },
        resolution: "Te metés de lleno a estudiar el parche nuevo. Cuesta, pero salís mejor parado que antes.",
      },
      {
        id: "comfort_pick",
        label: "Aferrarte a tu comfort pick",
        effects: { relations: { teamTrust: -5 } },
        resolution: "Insistís con lo que ya sabés jugar. El coach preferiría que te adaptes al meta actual.",
      },
      {
        id: "ask_coach",
        label: "Pedirle al coach nuevos campeones para practicar",
        effects: { relations: { teamTrust: 3 } },
        resolution: "Le pedís al coach una guía de qué practicar. El plan conjunto ordena la transición.",
      },
    ],
  },
  {
    id: "competitive_controversial_draft",
    category: "competitive",
    tier: "minor",
    title: "Draft controversial",
    description:
      "El coach te pide jugar algo fuera de tu zona de confort en el draft.",
    choices: [
      {
        id: "trust_coach",
        label: "Confiar en el coach",
        effects: { relations: { teamTrust: 8 } },
        resolution: "Confiás en el plan del coach aunque te incomode. La relación con el cuerpo técnico se fortalece.",
      },
      {
        id: "insist",
        label: "Insistir en tu pick de confianza",
        effects: { relations: { teamTrust: -8, prestige: 3 } },
        resolution: "Te plantás con tu pick de siempre. Sale bien a nivel individual, pero el coach queda descontento.",
      },
      {
        id: "middle_ground",
        label: "Buscar un término medio",
        effects: { relations: { teamTrust: 3 } },
        resolution: "Negocian una alternativa intermedia en el draft. Nadie sale del todo conforme, pero funciona.",
      },
    ],
  },
  {
    id: "competitive_rival_humiliation",
    category: "competitive",
    tier: "medium",
    title: "Humillación del rival histórico",
    description: "Tu rival histórico te humilla en un partido clave.",
    choices: [
      {
        id: "extra_focus",
        label: "Pedir revancha y foco extra en el rival",
        effects: { attributes: { clutch: 5 }, relations: { mentalHealth: -5 } },
        resolution:
          "Te obsesionás con la revancha. Afila tu mentalidad competitiva, pero te quita el sueño.",
      },
      {
        id: "stay_calm",
        label: "Mantener la calma",
        effects: { relations: { mentalHealth: 5 } },
        resolution: "Te lo tomás con filosofía. La derrota duele menos de lo que esperabas.",
      },
      {
        id: "public_anger",
        label: "Reaccionar públicamente con bronca",
        effects: { relations: { prestige: 5, fanLoyalty: -5 } },
        resolution: "Explotás en redes contra el rival. Genera repercusión, pero parte de tu público lo ve mal.",
      },
    ],
  },
  {
    id: "competitive_match_point",
    category: "competitive",
    tier: "major",
    title: "Match point en una final",
    description: "Estás en el punto de partido de una final, presión máxima.",
    choices: [
      {
        id: "safe_play",
        label: "Jugar conservador y seguro",
        effects: { attributes: { consistency: 5 }, relations: { mentalHealth: 5 } },
        resolution: "Jugás sin sobresaltos y cerrás el partido con la cabeza fría. El título llega sin dramatismo.",
      },
      {
        id: "all_in",
        label: "Ir agresivo, todo o nada",
        effects: { attributes: { clutch: 15 }, relations: { mentalHealth: -10 } },
        resolution:
          "Vas con todo en el momento decisivo. Sale la jugada de tu vida, pero el subidón de adrenalina te deja exhausto.",
      },
      {
        id: "trust_igl",
        label: "Confiar el call en tu IGL",
        effects: { relations: { teamTrust: 10 } },
        resolution: "Le dejás la decisión final a tu IGL. El equipo cierra el partido unido.",
      },
      {
        id: "take_initiative",
        label: "Tomar la iniciativa vos solo",
        effects: { attributes: { clutch: 10 }, relations: { teamTrust: -8 } },
        resolution:
          "Te la jugás por tu cuenta sin esperar la call. Funciona a nivel individual, pero al equipo no le gustó que te salgas del plan.",
      },
    ],
  },
  {
    id: "competitive_bad_scrims",
    category: "competitive",
    tier: "minor",
    title: "Semana de scrims mala",
    description: "Los scrims van mal toda la semana previa a playoffs.",
    choices: [
      {
        id: "extra_scrims",
        label: "Meter scrims extra",
        effects: { attributes: { consistency: 5 }, relations: { mentalHealth: -8 } },
        resolution: "Suman scrims extra para corregir errores. Mejora el nivel, pero llegan a playoffs cansados.",
      },
      {
        id: "rest",
        label: "Descansar antes de playoffs",
        effects: { relations: { mentalHealth: 10 } },
        resolution: "Cortan la semana antes y priorizan el descanso. Llegan frescos a la instancia decisiva.",
      },
      {
        id: "vod_review",
        label: "Solo revisar VODs",
        effects: { attributes: { metaAdaptability: 5 } },
        resolution: "Se enfocan en analizar VODs en vez de seguir scrimeando. Entienden mejor los errores sin desgastarse más.",
      },
    ],
  },

  // ── Rol-específicas ──────────────────────────────────────────────────
  {
    id: "role_support_sacrifice_build",
    category: "role_specific",
    tier: "medium",
    role: "support",
    title: "Sacrificar tu build por el carry",
    description:
      "Podés gastar tu oro en items propios o sacrificarlo para acelerar al carry del equipo.",
    choices: [
      {
        id: "sacrifice",
        label: "Sacrificar tu build por el carry",
        effects: { attributes: { leadership: 3 }, relations: { teamTrust: 12 } },
        resolution:
          "Le pasás el oro al carry sin dudarlo. El equipo cierra la partida arriba y todos saben quién lo hizo posible.",
      },
      {
        id: "prioritize_self",
        label: "Priorizar tu propia build",
        effects: { attributes: { mapControl: 6 }, relations: { teamTrust: -10 } },
        resolution:
          "Te quedás con tu propio oro. Jugás mejor individualmente, pero el carry se queda corto de items.",
      },
    ],
  },
  {
    id: "role_jungle_gank_or_farm",
    category: "role_specific",
    tier: "medium",
    role: "jungle",
    title: "Gankear o farmear",
    description:
      "En el early game, decidís priorizar ganks arriesgados o un farm seguro.",
    choices: [
      {
        id: "gank",
        label: "Gankear arriesgado",
        effects: { attributes: { gameSense: 8 }, relations: { teamTrust: -5, mentalHealth: -3 } },
        resolution:
          "Salís a buscar ganks tempranos de alto riesgo. Afinás la lectura del mapa, pero no siempre sale bien y el equipo lo nota.",
      },
      {
        id: "farm",
        label: "Farmear seguro",
        effects: { attributes: { macro: 8 }, relations: { teamTrust: 3 } },
        resolution: "Priorizás un farm limpio en vez de arriesgar. Llegás fuerte al mid game y el equipo confía más en tu criterio.",
      },
    ],
  },
  {
    id: "role_adc_resource_priority",
    category: "role_specific",
    tier: "medium",
    role: "adc",
    title: "Pedir prioridad de recursos",
    description:
      "Pedís al equipo que te prioricen los recursos por sobre otro carry.",
    choices: [
      {
        id: "request_priority",
        label: "Pedir prioridad de recursos",
        effects: { attributes: { teamfighting: 8 }, relations: { teamTrust: -10 } },
        resolution:
          "Pedís que te den prioridad de farm y objetivos. Se nota en las teamfights, pero el otro carry queda relegado.",
      },
      {
        id: "share",
        label: "Compartir recursos",
        effects: { attributes: { laning: 5 }, relations: { teamTrust: 8 } },
        resolution: "Repartís los recursos de forma pareja. El equipo funciona más equilibrado en la fase de línea.",
      },
    ],
  },
  {
    id: "role_top_isolated_split",
    category: "role_specific",
    tier: "medium",
    role: "top",
    title: "Quedar aislado en split push",
    description:
      "Aceptás quedar aislado en la línea sabiendo que el equipo puede perder una pelea 4v5.",
    choices: [
      {
        id: "stay_split",
        label: "Quedar aislado en split push",
        effects: { attributes: { splitPush: 10 }, relations: { teamTrust: -8 } },
        resolution:
          "Te quedás pusheando solo mientras el resto pelea 4v5. Sacás una ventaja enorme de mapa, pero el equipo se la jugó sin vos.",
      },
      {
        id: "regroup",
        label: "Volver a agrupar con el equipo",
        effects: { attributes: { mapControl: 5 }, relations: { teamTrust: 8 } },
        resolution: "Abandonás el split para pelear con el equipo. La pelea se define 5v5 y todos se sienten respaldados.",
      },
    ],
  },
  {
    id: "role_mid_aggressive_roam",
    category: "role_specific",
    tier: "medium",
    role: "mid",
    title: "Roam agresivo",
    description:
      "Dejás tu línea vulnerable para hacer un roam agresivo a otra línea.",
    choices: [
      {
        id: "roam",
        label: "Roam agresivo",
        effects: { attributes: { gameSense: 8 }, relations: { teamTrust: -5 } },
        resolution:
          "Dejás tu línea y vas a buscar impacto en otro lado del mapa. Cambia el rumbo de otra línea, pero tu propio carril se resiente.",
      },
      {
        id: "stay_lane",
        label: "Quedarte en línea",
        effects: { attributes: { mapControl: 5 }, relations: { teamTrust: 5 } },
        resolution: "Te quedás cuidando tu línea. No es la jugada más vistosa, pero mantiene todo controlado.",
      },
    ],
  },

  // ── Torneos internacionales (versión Tier B / Academy) ────────────────
  // Contenido placeholder: mismas 4 opciones "arquetípicas" con magnitud
  // creciente. Se reemplaza por diseño real cuando se aborde el contenido
  // de torneos en profundidad.
  {
    id: "intl_first_stand",
    category: "international",
    tier: "medium",
    title: "First Stand (Tier B/Academy)",
    description:
      "Tu equipo clasificó a la versión Academy/Tier B del First Stand internacional.",
    choices: [
      {
        id: "safe_play",
        label: "Jugar conservador y seguro",
        effects: { attributes: { consistency: 5 }, relations: { mentalHealth: 5, prestige: 8 } },
        resolution: "Juegan con la cabeza fría en su debut internacional. El resultado no es espectacular, pero es sólido.",
      },
      {
        id: "all_in",
        label: "Ir agresivo, todo o nada",
        effects: { attributes: { clutch: 10 }, relations: { mentalHealth: -8, prestige: 8 } },
        resolution: "Salen a jugar sin miedo contra rivales internacionales. Dejan una imagen que se comenta en toda la escena.",
      },
      {
        id: "trust_igl",
        label: "Confiar el call en tu IGL",
        effects: { relations: { teamTrust: 8, prestige: 8 } },
        resolution: "Dejan que el IGL lidere las decisiones en el escenario grande. El equipo responde unido.",
      },
      {
        id: "solo_initiative",
        label: "Tomar la iniciativa vos solo",
        effects: { attributes: { clutch: 8 }, relations: { teamTrust: -6, prestige: 8 } },
        resolution:
          "Tomás vos las riendas en el momento clave frente al público internacional. Tu nombre queda grabado, aunque no todos en el equipo lo vieron con buenos ojos.",
      },
    ],
  },
  {
    id: "intl_msi",
    category: "international",
    tier: "major",
    title: "MSI (Tier B/Academy)",
    description:
      "Clasificaste al MSI de la escena Academy/Tier B, midiéndote contra los mejores de otras regiones.",
    choices: [
      {
        id: "safe_play",
        label: "Jugar conservador y seguro",
        effects: { attributes: { consistency: 8 }, relations: { mentalHealth: 8, prestige: 15 } },
        resolution: "Juegan con paciencia contra el nivel internacional. El resultado consolida el nombre del equipo afuera de Corea.",
      },
      {
        id: "all_in",
        label: "Ir agresivo, todo o nada",
        effects: { attributes: { clutch: 18 }, relations: { mentalHealth: -12, prestige: 20 } },
        resolution: "Se juegan todo en cada partida del MSI. El riesgo paga en prestigio, aunque el desgaste es enorme.",
      },
      {
        id: "trust_igl",
        label: "Confiar el call en tu IGL",
        effects: { relations: { teamTrust: 12, prestige: 15 } },
        resolution: "El IGL lleva la voz cantante en el torneo más grande que jugaron hasta ahora. La confianza del equipo se dispara.",
      },
      {
        id: "solo_initiative",
        label: "Tomar la iniciativa vos solo",
        effects: { attributes: { clutch: 15 }, relations: { teamTrust: -10, prestige: 18 } },
        resolution:
          "Tomás decisiones por tu cuenta en el escenario internacional. Quedás como protagonista, aunque el equipo siente que te la jugaste sin ellos.",
      },
    ],
  },
  {
    id: "intl_worlds",
    category: "international",
    tier: "major",
    title: "Worlds (Tier B/Academy)",
    description:
      "Llegaste al torneo más importante del año en la escena Academy/Tier B: el equivalente a Worlds.",
    choices: [
      {
        id: "safe_play",
        label: "Jugar conservador y seguro",
        effects: { attributes: { consistency: 10 }, relations: { mentalHealth: 10, prestige: 20 } },
        resolution: "Cierran su participación en Worlds sin sobresaltos. Es un resultado que va a quedar en tu currículum para siempre.",
      },
      {
        id: "all_in",
        label: "Ir agresivo, todo o nada",
        effects: { attributes: { clutch: 25 }, relations: { mentalHealth: -15, prestige: 30 } },
        resolution:
          "Van con todo en el torneo más grande del año. Queda una actuación para el recuerdo, pero el desgaste físico y mental es enorme.",
      },
      {
        id: "trust_igl",
        label: "Confiar el call en tu IGL",
        effects: { relations: { teamTrust: 15, prestige: 22 } },
        resolution: "El equipo juega Worlds como una unidad, confiando ciegamente en su IGL. Sea cual sea el resultado, salen fortalecidos como grupo.",
      },
      {
        id: "solo_initiative",
        label: "Tomar la iniciativa vos solo",
        effects: { attributes: { clutch: 20 }, relations: { teamTrust: -12, prestige: 25 } },
        resolution:
          "Te convertís en el nombre propio de la campaña de Worlds. Tu prestigio individual explota, aunque puertas adentro quedan preguntas sobre el trabajo en equipo.",
      },
    ],
  },
];
