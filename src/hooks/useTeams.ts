"use client";

import { useEffect, useState } from "react";
import { TEAMS as STATIC_TEAMS, type TeamDefinition } from "@/content/teams";

/** Teams from Supabase (crest/jersey uploaded via the admin dashboard),
 *  falling back to the bundled static list until the fetch resolves or if
 *  Supabase isn't configured. */
export function useTeams(): TeamDefinition[] {
  const [teams, setTeams] = useState<TeamDefinition[]>(STATIC_TEAMS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data: { teams?: TeamDefinition[] }) => {
        if (!cancelled && Array.isArray(data.teams) && data.teams.length > 0) {
          setTeams(data.teams);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return teams;
}
