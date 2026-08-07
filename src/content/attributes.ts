import type { Role } from "@/types/game";

/**
 * General attributes: every character has all 5, regardless of role.
 */
export const GENERAL_ATTRIBUTES = [
  {
    id: "teamSynergy",
    label: "Sinergia de equipo",
    description: "Qué tan bien se acopla a compañeros nuevos",
  },
  {
    id: "consistency",
    label: "Consistencia",
    description: "Varianza entre partidas buenas y malas",
  },
  {
    id: "clutch",
    label: "Mental",
    description: "Capacidad de resistencia al tilteo ante situaciones adversas",
  },
  {
    id: "metaAdaptability",
    label: "Adaptabilidad de meta",
    description: "Qué tan rápido asimila parches/metas nuevos",
  },
  {
    id: "hands",
    label: "Manos",
    description: "Precisión, velocidad y reflejos de ejecución mecánica (muñeca, reacción)",
  },
] as const;

export type GeneralAttributeId = (typeof GENERAL_ATTRIBUTES)[number]["id"];

/**
 * Special attributes: shared pool, each role uses exactly 3 of them.
 */
export const SPECIAL_ATTRIBUTES = [
  {
    id: "splitPush",
    label: "Splitpush",
    description: "Presión en línea lateral aislado del equipo",
  },
  {
    id: "soloCarry",
    label: "Outplay / Solo Killing",
    description: "Capacidad de ganar duelos 1v1 por mecánica individual",
  },
  {
    id: "mapControl",
    label: "Control del mapa",
    description: "Wards, deward, información y presión de mapa",
  },
  {
    id: "gameSense",
    label: "Game Sense",
    description: "Lectura de mapa, timing de objetivos, previsión de ganks",
  },
  {
    id: "macro",
    label: "Macro",
    description: "Decisiones de mapa completo, rotaciones, objetivos",
  },
  {
    id: "leadership",
    label: "Liderazgo",
    description: "Shotcalling y capacidad de dirigir al equipo",
  },
  {
    id: "mechanics",
    label: "Mecánica",
    description: "Precisión de combos, control de habilidades, CS/min",
  },
  {
    id: "laning",
    label: "Laning",
    description: "Rendimiento 1v1/2v2 en la fase de línea",
  },
  {
    id: "teamfighting",
    label: "Teamfighting",
    description: "Impacto en peleas 5v5",
  },
  {
    id: "rotations",
    label: "Rotaciones",
    description: "Movimiento entre líneas y objetivos para generar ventajas",
  },
] as const;

export type SpecialAttributeId = (typeof SPECIAL_ATTRIBUTES)[number]["id"];

export type AttributeId = GeneralAttributeId | SpecialAttributeId;

export const ROLE_SPECIAL_ATTRIBUTES: Record<Role, SpecialAttributeId[]> = {
  top: ["splitPush", "soloCarry", "mapControl"],
  jungle: ["gameSense", "macro", "leadership"],
  mid: ["gameSense", "mapControl", "leadership"],
  adc: ["mechanics", "laning", "teamfighting"],
  support: ["mapControl", "rotations", "leadership"],
};

export function getAttributesForRole(role: Role): AttributeId[] {
  return [
    ...GENERAL_ATTRIBUTES.map((a) => a.id),
    ...ROLE_SPECIAL_ATTRIBUTES[role],
  ];
}

const ALL_ATTRIBUTE_DEFS = [...GENERAL_ATTRIBUTES, ...SPECIAL_ATTRIBUTES];

export const ATTRIBUTE_LABELS: Record<AttributeId, string> = Object.fromEntries(
  ALL_ATTRIBUTE_DEFS.map((a) => [a.id, a.label]),
) as Record<AttributeId, string>;

/** Fallback used defensively (e.g. clamping) — actual starting rolls come from rollStartingAttributes. */
export const STARTING_ATTRIBUTE_VALUE = 50;

/**
 * Each general attribute is the "favorite" of exactly 2 roles, so every
 * role gets 2 favorites and every general attribute is favored by 2 roles.
 */
export const ROLE_FAVORITE_GENERAL_ATTRIBUTES: Record<Role, GeneralAttributeId[]> = {
  top: ["consistency", "clutch"],
  jungle: ["metaAdaptability", "teamSynergy"],
  mid: ["clutch", "hands"],
  adc: ["hands", "consistency"],
  support: ["teamSynergy", "metaAdaptability"],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Starting roll for a new character: general attributes land in 50-65
 * (58-65 if it's one of the role's 2 favorites), special/role attributes
 * always roll 55-70.
 */
export function rollStartingAttributes(role: Role): Record<AttributeId, number> {
  const favorites = new Set(ROLE_FAVORITE_GENERAL_ATTRIBUTES[role]);
  const result: Partial<Record<AttributeId, number>> = {};

  for (const attr of GENERAL_ATTRIBUTES) {
    result[attr.id] = favorites.has(attr.id) ? randomInt(58, 65) : randomInt(50, 60);
  }
  for (const id of ROLE_SPECIAL_ATTRIBUTES[role]) {
    result[id] = randomInt(55, 70);
  }

  return result as Record<AttributeId, number>;
}
