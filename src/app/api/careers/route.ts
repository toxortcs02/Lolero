import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CareerResult } from "@/types/game";

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as CareerResult;

  const { error } = await supabase.from("career_results").insert({
    nick: body.nick,
    role: body.role,
    final_team: body.finalTeam,
    final_league: body.finalLeague,
    seasons_played: body.seasonsPlayed,
    score: body.score,
    summary: body.summary,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
