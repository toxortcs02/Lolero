import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EVENTS } from "@/content/events";

/** Upserts the bundled static events into the DB — safe to run repeatedly.
 *  Used once to populate the empty `events` table, and afterwards as a
 *  "restore defaults" utility (existing rows with the same id get overwritten,
 *  events created from scratch in the dashboard are left untouched). */
export async function POST() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }

  const rows = EVENTS.map((e) => ({
    id: e.id,
    category: e.category,
    tier: e.tier,
    title: e.title,
    description: e.description,
    role: e.role ?? null,
    choices: e.choices,
  }));

  const { error } = await supabaseAdmin.from("events").upsert(rows, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ seeded: rows.length });
}
