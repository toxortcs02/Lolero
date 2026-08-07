import type { Role } from "@/types/game";

export const ROLE_LABELS: Record<Role, string> = {
  top: "Top",
  jungle: "Jungla",
  mid: "Mid",
  adc: "ADC",
  support: "Support",
};

export const ROLES: Role[] = ["top", "jungle", "mid", "adc", "support"];

/** Age a Challengers rookie starts at. Turning 18 unlocks LCK call-up events. */
export const STARTING_AGE = 17;

/** Hard retirement cap: forced retirement once the year played at this age ends. */
export const MAX_CAREER_AGE = 30;
