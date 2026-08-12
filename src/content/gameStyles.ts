import type { AttributeId } from "@/content/attributes";
import type { Role } from "@/types/game";

export interface GameStyleOption {
  id: string;
  label: string;
  description: string;
  /** Campeones de referencia del estilo — solo flavor, no atados a ninguna mecánica. */
  champions: string[];
  /** Puntos que se suman a los atributos rolleados al elegir este estilo.
   *  Valores de arranque, pensados para ajustar fácil (ver abajo). */
  boosts: Partial<Record<AttributeId, number>>;
}

/**
 * Valores de boost — placeholder pensado para tocar rápido: primario +10,
 * secundario +6 en casi todos. Cambiá los números de "boosts" de cada
 * estilo, no hace falta tocar nada más.
 */
export const GAME_STYLES: Record<Role, GameStyleOption[]> = {
  top: [
    {
      id: "top_utility",
      label: "Utilidad",
      description: "Tanque que abre espacio y absorbe recursos del rival.",
      champions: ["Ornn", "Shen", "Sion", "Maokai", "Poppy"],
      boosts: { mapControl: 10, teamSynergy: 6 },
    },
    {
      id: "top_fighter",
      label: "Peleadores",
      description: "Duelista que gana la línea 1v1 y busca side lane.",
      champions: ["Darius", "Renekton", "Camille", "Fiora", "Jax"],
      boosts: { soloCarry: 10, hands: 6 },
    },
    {
      id: "top_flex",
      label: "Comodín",
      description: "Pool amplio, se adapta al draft y sorprende con picks raros.",
      champions: ["Gnar", "Gangplank", "Kennen", "Teemo", "Singed"],
      boosts: { splitPush: 10, metaAdaptability: 6 },
    },
  ],
  jungle: [
    {
      id: "jungle_selfish",
      label: "Selfish",
      description: "Prioriza su propio farm y snowball por sobre el del equipo.",
      champions: ["Kindred", "Kayn", "Master Yi", "Graves", "Karthus"],
      boosts: { macro: 10, hands: 6 },
    },
    {
      id: "jungle_fighter",
      label: "Peleadores",
      description: "Vive invadiendo y buscando peleas tempranas.",
      champions: ["Vi", "Xin Zhao", "Jarvan IV", "Warwick", "Lillia"],
      boosts: { gameSense: 10, clutch: 6 },
    },
    {
      id: "jungle_utility",
      label: "Utilidad",
      description: "Setea objetivos y habilita a las líneas antes que a sí mismo.",
      champions: ["Sejuani", "Zac", "Nunu", "Ivern", "Rammus"],
      boosts: { leadership: 10, teamSynergy: 6 },
    },
  ],
  mid: [
    {
      id: "mid_utility",
      label: "Utilidad",
      description: "Control de visión y zona antes que daño puro.",
      champions: ["Orianna", "Galio", "Lulu", "Karma", "Anivia"],
      boosts: { mapControl: 10, teamSynergy: 6 },
    },
    {
      id: "mid_mage",
      label: "Magos",
      description: "Poke y control de wave para dictar el tempo de la partida.",
      champions: ["Syndra", "Viktor", "Xerath", "Azir", "Ryze"],
      boosts: { leadership: 10, metaAdaptability: 6 },
    },
    {
      id: "mid_assassin",
      label: "Asesinos/ADC",
      description: "Busca el momento justo para eliminar al carry rival.",
      champions: ["Zed", "Talon", "Akali", "Qiyana", "Kassadin"],
      boosts: { gameSense: 10, hands: 6 },
    },
  ],
  adc: [
    {
      id: "adc_glasscannon",
      label: "Glasscannon",
      description: "Máximo daño en teamfight, cero margen de error.",
      champions: ["Jinx", "Kalista", "Draven", "Miss Fortune", "Ezreal"],
      boosts: { teamfighting: 10, hands: 6 },
    },
    {
      id: "adc_rare_picks",
      label: "Picks raros",
      description: "Gana la línea con algo que el rival no esperaba.",
      champions: ["Ziggs", "Swain", "Senna", "Corki", "Xerath"],
      boosts: { laning: 10, metaAdaptability: 6 },
    },
    {
      id: "adc_hypercarry",
      label: "Hypercarry",
      description: "Escala más que nadie y define el late game.",
      champions: ["Vayne", "Aphelios", "Kog'Maw", "Zeri", "Twitch"],
      boosts: { mechanics: 10, consistency: 6 },
    },
  ],
  support: [
    {
      id: "support_peeler",
      label: "Peeler",
      description: "Protege al carry con CC y herramientas defensivas.",
      champions: ["Janna", "Braum", "Tahm Kench", "Lulu", "Bard"],
      boosts: { mapControl: 10, teamSynergy: 6 },
    },
    {
      id: "support_engage",
      label: "Engage",
      description: "Inicia peleas e impone el ritmo desde la línea de soporte.",
      champions: ["Leona", "Nautilus", "Rell", "Rakan", "Thresh"],
      boosts: { leadership: 10, clutch: 6 },
    },
    {
      id: "support_enchanter",
      label: "Enchanters",
      description: "Cura, escuda y roamea para potenciar a todo el equipo.",
      champions: ["Sona", "Soraka", "Nami", "Yuumi", "Milio"],
      boosts: { rotations: 10, teamSynergy: 6 },
    },
  ],
};