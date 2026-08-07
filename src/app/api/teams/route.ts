import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { TEAMS as STATIC_TEAMS } from "@/content/teams";

export async function GET() {
  if (!supabase) return NextResponse.json({ teams: STATIC_TEAMS });

  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error || !data || data.length === 0) {
    return NextResponse.json({ teams: STATIC_TEAMS });
  }

  const teams = data.map((t) => ({
    id: t.id,
    name: t.name,
    tag: t.tag,
    league: (t.league ?? "challengers") as "challengers" | "lck",
    primaryColor: t.primary_color,
    secondaryColor: t.secondary_color,
    colorConfirmed: true,
    crestUrl: t.crest_url ?? undefined,
    jerseyUrl: t.jersey_url ?? undefined,
    baseStrength: t.base_strength ?? 5,
  }));

  return NextResponse.json({ teams });
}
