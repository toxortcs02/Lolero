/**
 * LCK Challengers League 2026 — starting pool (real org names, MVP art is
 * color + initials only; real crests/kits get uploaded later via the
 * admin dashboard, see src/content/README.md).
 *
 * Colors are best-effort approximations of real brand colors. Flagged
 * entries (`colorConfirmed: false`) need a human check before going live.
 *
 * `league` splits the pool in two: "challengers" is where every career
 * starts (rookie draw, early transfer offers), "lck" is the top flight —
 * teams share their org's real name/colors with their Challengers sibling,
 * one tier up. Anything that mixes teams together (rookie draw, transfer
 * offers, league standings) must filter by league — see careerStore.ts and
 * transferEvents.ts.
 */
export interface TeamDefinition {
  id: string;
  name: string;
  tag: string;
  league: "challengers" | "lck";
  primaryColor: string;
  secondaryColor: string;
  colorConfirmed: boolean;
  /** Uploaded via the admin dashboard once available; falls back to color+initials. */
  crestUrl?: string;
  jerseyUrl?: string;
  /**
   * 1-10 baseline org strength used to bias the (cosmetic, non-simulated)
   * league table. Rough placeholder based on real-org reputation — not a
   * researched stat, adjust freely.
   */
  baseStrength: number;
}

export const TEAMS: TeamDefinition[] = [
  {
    id: "ns-c",
    name: "NS Challengers",
    tag: "NS.C",
    league: "challengers",
    primaryColor: "#C8102E",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 5,
  },
  {
    id: "kt-c",
    name: "KT Challengers",
    tag: "KT.C",
    league: "challengers",
    primaryColor: "#FF0000",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 7,
  },
  {
    id: "drx-c",
    name: "DRX Challengers",
    tag: "DRX.C",
    league: "challengers",
    primaryColor: "#00A9E0",
    secondaryColor: "#0B1F3A",
    colorConfirmed: true,
    baseStrength: 6,
  },
  {
    id: "hle-c",
    name: "HLE Challengers",
    tag: "HLE.C",
    league: "challengers",
    primaryColor: "#FF6600",
    secondaryColor: "#1B2A4A",
    colorConfirmed: true,
    baseStrength: 7,
  },
  {
    id: "soop-c",
    name: "SOOPers Challengers",
    tag: "SOOP.C",
    league: "challengers",
    primaryColor: "#00C7AE",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 5,
  },
  {
    id: "dplus-c",
    name: "Dplus Challengers",
    tag: "DPLUS.C",
    league: "challengers",
    primaryColor: "#00A19A",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 6,
  },
  {
    id: "gen-ga",
    name: "Gen.G Global Academy",
    tag: "GEN.GA",
    league: "challengers",
    primaryColor: "#AA8B56",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 9,
  },
  {
    id: "fearx-y",
    name: "FEARX Youth",
    tag: "FEARX.Y",
    league: "challengers",
    primaryColor: "#6E3FA3",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 4,
  },
  {
    id: "brion-c",
    name: "BRION Challengers",
    tag: "BRION.C",
    league: "challengers",
    primaryColor: "#00A651",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 6,
  },
  {
    id: "t1-a",
    name: "T1 Esports Academy",
    tag: "T1.A",
    league: "challengers",
    primaryColor: "#E2012D",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 9,
  },

  // --- LCK (primera división) — mismo org, mismos colores/escudo/camiseta
  // que su equipo Challengers hermano, un escalón más arriba. Los nombres
  // con sponsor (BNK FEARX, OKSavingsBank BRION, Dplus KIA) cambian de año
  // a año en la vida real — colorConfirmed: false marca los que conviene
  // reconfirmar antes de mostrar en producción.
  {
    id: "t1",
    name: "T1",
    tag: "T1",
    league: "lck",
    primaryColor: "#E2012D",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 10,
  },
  {
    id: "gen-g",
    name: "Gen.G",
    tag: "GEN",
    league: "lck",
    primaryColor: "#AA8B56",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 10,
  },
  {
    id: "hle",
    name: "Hanwha Life Esports",
    tag: "HLE",
    league: "lck",
    primaryColor: "#FF6600",
    secondaryColor: "#1B2A4A",
    colorConfirmed: true,
    baseStrength: 8,
  },
  {
    id: "kt",
    name: "KT Rolster",
    tag: "KT",
    league: "lck",
    primaryColor: "#FF0000",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 8,
  },
  {
    id: "dplus",
    name: "Dplus KIA",
    tag: "DK",
    league: "lck",
    primaryColor: "#00A19A",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 7,
  },
  {
    id: "drx",
    name: "DRX",
    tag: "DRX",
    league: "lck",
    primaryColor: "#00A9E0",
    secondaryColor: "#0B1F3A",
    colorConfirmed: true,
    baseStrength: 6,
  },
  {
    id: "ns",
    name: "Nongshim RedForce",
    tag: "NS",
    league: "lck",
    primaryColor: "#C8102E",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 6,
  },
  {
    id: "brion",
    name: "OKSavingsBank BRION",
    tag: "BRO",
    league: "lck",
    primaryColor: "#00A651",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 6,
  },
  {
    id: "soop",
    name: "SOOP",
    tag: "SOOP",
    league: "lck",
    primaryColor: "#00C7AE",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 5,
  },
  {
    id: "fearx",
    name: "BNK FEARX",
    tag: "FOX",
    league: "lck",
    primaryColor: "#6E3FA3",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 5,
  },
];
