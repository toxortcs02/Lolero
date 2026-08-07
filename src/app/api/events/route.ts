import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { EVENTS as STATIC_EVENTS } from "@/content/events";

export async function GET() {
  if (!supabase) return NextResponse.json({ events: STATIC_EVENTS });

  const { data, error } = await supabase.from("events").select("*").order("title");
  if (error || !data || data.length === 0) {
    return NextResponse.json({ events: STATIC_EVENTS });
  }

  const events = data.map((e) => ({
    id: e.id,
    category: e.category,
    tier: e.tier,
    title: e.title,
    description: e.description,
    role: e.role ?? undefined,
    choices: e.choices,
  }));

  return NextResponse.json({ events });
}
