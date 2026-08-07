/**
 * LCK Challengers League 2026 — starting pool (real org names, MVP art is
 * color + initials only; real crests/kits get uploaded later via the
 * admin dashboard, see src/content/README.md).
 *
 * Colors are best-effort approximations of real brand colors. Flagged
 * entries (`colorConfirmed: false`) need a human check before going live.
 */
export interface TeamDefinition {
  id: string;
  name: string;
  tag: string;
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
    primaryColor: "#C8102E",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 5,
  },
  {
    id: "kt-c",
    name: "KT Challengers",
    tag: "KT.C",
    primaryColor: "#FF0000",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 7,
  },
  {
    id: "drx-c",
    name: "DRX Challengers",
    tag: "DRX.C",
    primaryColor: "#00A9E0",
    secondaryColor: "#0B1F3A",
    colorConfirmed: true,
    baseStrength: 6,
  },
  {
    id: "hle-c",
    name: "HLE Challengers",
    tag: "HLE.C",
    primaryColor: "#FF6600",
    secondaryColor: "#1B2A4A",
    colorConfirmed: true,
    baseStrength: 7,
  },
  {
    id: "soop-c",
    name: "SOOPers Challengers",
    tag: "SOOP.C",
    primaryColor: "#00C7AE",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 5,
  },
  {
    id: "dplus-c",
    name: "Dplus Challengers",
    tag: "DPLUS.C",
    primaryColor: "#00A19A",
    secondaryColor: "#000000",
    colorConfirmed: false,
    baseStrength: 6,
  },
  {
    id: "gen-ga",
    name: "Gen.G Global Academy",
    tag: "GEN.GA",
    primaryColor: "#AA8B56",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 9,
  },
  {
    id: "fearx-y",
    name: "FEARX Youth",
    tag: "FEARX.Y",
    primaryColor: "#6E3FA3",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 4,
  },
  {
    id: "brion-c",
    name: "BRION Challengers",
    tag: "BRION.C",
    primaryColor: "#00A651",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 6,
  },
  {
    id: "t1-a",
    name: "T1 Esports Academy",
    tag: "T1.A",
    primaryColor: "#E2012D",
    secondaryColor: "#000000",
    colorConfirmed: true,
    baseStrength: 9,
  },
];
