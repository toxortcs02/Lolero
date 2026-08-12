import type { AttributeId } from "@/content/attributes";
import type { EventEffects, Role } from "@/types/game";

export interface BigMomentOption {
  id: string;
  label: string;
  /** Atributo que pesa la tirada personal — cuanto más alto, mejor la chance. */
  statId: AttributeId;
  /** Probabilidad base antes del ajuste por atributo (0-1). ~0.45-0.65 típico. */
  baseChance: number;
  successEffects: EventEffects;
  successResolution: string;
  failureEffects: EventEffects;
  failureResolution: string;
}

export interface BigMoment {
  id: string;
  role: Role;
  title: string;
  description: string;
  options: BigMomentOption[];
}

/** Efectos placeholder compartidos — ajustá los números libremente. */
const SUCCESS: BigMomentOption["successEffects"] = { relations: { prestige: 10, mentalHealth: 5 } };
const FAILURE: BigMomentOption["failureEffects"] = { relations: { prestige: -5, mentalHealth: -8 } };

export const BIG_MOMENTS: BigMoment[] = [
  // ── TOP ──────────────────────────────────────────────────────────────
  {
    id: "top_tp_flank",
    role: "top",
    title: "TP flank",
    description: "Tu línea está pusheada a fondo y la teamfight arranca del otro lado del mapa.",
    options: [
      {
        id: "flank",
        label: "Teletransportarte al flanco",
        statId: "soloCarry",
        baseChance: 0.45,
        successEffects: SUCCESS,
        successResolution: "Aparecés de la nada por el costado. La pelea se rompe a tu favor antes de que el rival reaccione.",
        failureEffects: FAILURE,
        failureResolution: "El TP se lee de lejos. Llegás, pero el rival ya te estaba esperando.",
      },
      {
        id: "split",
        label: "Quedarte pusheando la línea",
        statId: "splitPush",
        baseChance: 0.6,
        successEffects: SUCCESS,
        successResolution: "Tiras la torre y generás presión que obliga al rival a mandar gente — tu equipo juega 5v4 en el mapa.",
        failureEffects: FAILURE,
        failureResolution: "Pusheás, pero el rival ignora tu presión y la pelea sucede sin que hayas cambiado nada.",
      },
    ],
  },
  {
    id: "top_tower_duel",
    role: "top",
    title: "Duelo bajo la torre enemiga",
    description: "El rival se queda solo empujando, bajo su propia torre, con la vida justa.",
    options: [
      {
        id: "duel",
        label: "Buscar el duelo",
        statId: "hands",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "Ganás la ejecución del combo y te llevás la kill bajo la torre. El chat explota.",
        failureEffects: FAILURE,
        failureResolution: "Calculás mal el daño de la torre y sos vos el que termina en el piso.",
      },
      {
        id: "wait",
        label: "Esperar refuerzos",
        statId: "mapControl",
        baseChance: 0.65,
        successEffects: SUCCESS,
        successResolution: "Tu paciencia paga: llega el jungla y cierran la kill entre los dos, sin arriesgar nada.",
        failureEffects: FAILURE,
        failureResolution: "Esperás de más — el rival se cura y la ventana se cierra sin que pase nada.",
      },
    ],
  },

  // ── JUNGLE ───────────────────────────────────────────────────────────
  {
    id: "jungle_smite_fight",
    role: "jungle",
    title: "Pelea de smites",
    description: "Baron a media vida, ambos junglas entran al pozo al mismo tiempo.",
    options: [
      {
        id: "contest",
        label: "Contestar el smite",
        statId: "hands",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "Tu smite llega primero. Baron es tuyo, y con él, el control total del mapa.",
        failureEffects: FAILURE,
        failureResolution: "El smite rival te gana por un frame. Pierden el objetivo y varios summoners tirados.",
      },
      {
        id: "zone",
        label: "Jugar la visión y zonear",
        statId: "gameSense",
        baseChance: 0.6,
        successEffects: SUCCESS,
        successResolution: "Leés bien el timing: zoneás al jungla rival y tu equipo saca el Baron sin pelear.",
        failureEffects: FAILURE,
        failureResolution: "El rival entra igual desde un ángulo que no cubriste y se lleva el objetivo limpio.",
      },
    ],
  },
  {
    id: "jungle_bot_gank",
    role: "jungle",
    title: "Gank para el doble en bot",
    description: "Tu soporte pide un gank en bot: hay una ventana para sacar el doble kill.",
    options: [
      {
        id: "commit",
        label: "Bajar a por el doble kill",
        statId: "macro",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "El gank sale perfecto: doble kill en bot y tu ADC queda libre para farmear.",
        failureEffects: FAILURE,
        failureResolution: "Bajás, pero el bot rival lo ve venir y escapa — perdiste tiempo de tu propia jungla.",
      },
      {
        id: "own_jungle",
        label: "Priorizar tu propio camino",
        statId: "gameSense",
        baseChance: 0.65,
        successEffects: SUCCESS,
        successResolution: "Te quedás farmeando tu jungla y llegás al siguiente objetivo con un camp de ventaja.",
        failureEffects: FAILURE,
        failureResolution: "Tu soporte queda solo en bot, sin el gank, y el chat te lo hace saber.",
      },
    ],
  },

  // ── MID ──────────────────────────────────────────────────────────────
  {
    id: "mid_rotate_or_solokill",
    role: "mid",
    title: "Rotar o buscar la solokill",
    description: "Tu rival de línea quedó adelantado y sin flash — hay una solokill sobre la mesa.",
    options: [
      {
        id: "solokill",
        label: "Buscar la solokill",
        statId: "gameSense",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "Cerrás la solokill limpia. Tu línea queda 1000% ganada y el enemigo se tilta.",
        failureEffects: FAILURE,
        failureResolution: "El combo no alcanza y el rival escapa con una barra de vida — perdiste el momento.",
      },
      {
        id: "rotate",
        label: "Rotar a ayudar otra línea",
        statId: "mapControl",
        baseChance: 0.65,
        successEffects: SUCCESS,
        successResolution: "Tu rotación sorprende por el costado y convertís una kill en otra línea sin arriesgar la tuya.",
        failureEffects: FAILURE,
        failureResolution: "Rotás pero llegás tarde — la jugada ya había terminado y tu línea se enfrió de gratis.",
      },
    ],
  },
  {
    id: "mid_herald_steal",
    role: "mid",
    title: "Robar el Heraldo con visión límite",
    description: "El equipo rival está parado en el Heraldo, casi listos para llevárselo.",
    options: [
      {
        id: "steal",
        label: "Arriesgar el robo",
        statId: "hands",
        baseChance: 0.45,
        successEffects: SUCCESS,
        successResolution: "El smite se clava justo a tiempo. Le robás el Heraldo en la cara a todo el equipo rival.",
        failureEffects: FAILURE,
        failureResolution: "Entrás a robar pero te faltó daño — terminás perdiendo summoners y casi la vida.",
      },
      {
        id: "concede",
        label: "Jugar seguro y cederlo",
        statId: "leadership",
        baseChance: 0.65,
        successEffects: SUCCESS,
        successResolution: "Cedés el objetivo pero reorganizás al equipo para la próxima pelea, que ganan cómodos.",
        failureEffects: FAILURE,
        failureResolution: "Cedés el Heraldo y el rival lo usa de inmediato para tirar tu torre de mid.",
      },
    ],
  },

  // ── ADC ──────────────────────────────────────────────────────────────
  {
    id: "adc_malphite_ult",
    role: "adc",
    title: "Reflejos: la ulti de Malphite",
    description: "Malphite salta al medio de tu equipo con la ulti cargada — tenés una fracción de segundo.",
    options: [
      {
        id: "flash",
        label: "Flashear al toque",
        statId: "hands",
        baseChance: 0.55,
        successEffects: SUCCESS,
        successResolution: "Flasheás justo a tiempo. La ulti pega a todos menos a vos, que quedás libre para limpiar la pelea.",
        failureEffects: FAILURE,
        failureResolution: "El flash sale tarde — te agarra la ulti de lleno y quedás fuera de la pelea desde el inicio.",
      },
      {
        id: "trust_peel",
        label: "Confiar en la peel del equipo",
        statId: "teamfighting",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "Guardás el flash. Tu soporte cubre el engage y vos seguís disparando sin gastar recursos.",
        failureEffects: FAILURE,
        failureResolution: "La peel llega tarde — te quedás sin flash y sin peel al mismo tiempo.",
      },
    ],
  },
  {
    id: "adc_dive_kite",
    role: "adc",
    title: "Kitear bajo dive 2v1",
    description: "Top y jungla rival te divean bajo tu propia torre.",
    options: [
      {
        id: "kite",
        label: "Kitear y buscar salir vivo",
        statId: "mechanics",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "Cada auto-attack cuenta: kiteás perfecto y salís del dive con los dos con la vida al límite.",
        failureEffects: FAILURE,
        failureResolution: "Un stun te corta el kite a mitad de camino y no llegás a salir del rango de la torre.",
      },
      {
        id: "trade",
        label: "Trade agresivo antes de morir",
        statId: "laning",
        baseChance: 0.45,
        successEffects: SUCCESS,
        successResolution: "Te llevás una kill en el intercambio antes de caer — trade a tu favor pese al dive.",
        failureEffects: FAILURE,
        failureResolution: "El trade sale mal: caés vos sin llevarte nada a cambio.",
      },
    ],
  },

  // ── SUPPORT ──────────────────────────────────────────────────────────
  {
    id: "support_roam_or_call",
    role: "support",
    title: "Roamear o pedir el gank",
    description: "Tu línea está estable — podés dejarla sola para influir en otro lado del mapa.",
    options: [
      {
        id: "roam_mid",
        label: "Roamear a mid",
        statId: "rotations",
        baseChance: 0.55,
        successEffects: SUCCESS,
        successResolution: "Tu roam sorprende a mid: kill libre y tu mid queda con prioridad de wave para el resto del juego.",
        failureEffects: FAILURE,
        failureResolution: "Roameás pero mid ya se había retirado — perdiste tiempo sin generar nada.",
      },
      {
        id: "call_jungle",
        label: "Pedir el gank del jungla",
        statId: "leadership",
        baseChance: 0.5,
        successEffects: SUCCESS,
        successResolution: "Tu llamado a tiempo trae al jungla justo cuando hacía falta: doble kill en bot.",
        failureEffects: FAILURE,
        failureResolution: "El jungla llega, pero el rival ya había recallado — el gank se pierde.",
      },
    ],
  },
  {
    id: "support_decisive_engage",
    role: "support",
    title: "Engage arriesgado en la pelea decisiva",
    description: "Ambos equipos están parados, nadie quiere abrir la teamfight que define el partido.",
    options: [
      {
        id: "initiate",
        label: "Iniciar la pelea",
        statId: "leadership",
        baseChance: 0.45,
        successEffects: SUCCESS,
        successResolution: "Tu engage conecta perfecto: agarrás al carry rival y la pelea se gana antes de empezar.",
        failureEffects: FAILURE,
        failureResolution: "El engage falla y quedás adelantado, solo, frente a los cinco.",
      },
      {
        id: "wait_open",
        label: "Esperar que el rival se abra",
        statId: "mapControl",
        baseChance: 0.6,
        successEffects: SUCCESS,
        successResolution: "La paciencia rinde: el rival se desespera, se abre, y tu equipo castiga el error.",
        failureEffects: FAILURE,
        failureResolution: "Nadie se abre nunca y el reloj termina forzando una pelea desordenada, sin tu control.",
      },
    ],
  },
];

export function getBigMomentsForRole(role: Role): BigMoment[] {
  return BIG_MOMENTS.filter((bm) => bm.role === role);
}

export function pickBigMoment(role: Role): BigMoment {
  const pool = getBigMomentsForRole(role);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBigMoment(id: string): BigMoment | undefined {
  return BIG_MOMENTS.find((bm) => bm.id === id);
}
