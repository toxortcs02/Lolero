import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/lib/slugify";
import type { EventDefinition } from "@/types/game";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin.from("events").select("*").order("title");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data });
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }

  const body = (await request.json()) as Partial<EventDefinition>;

  if (!body.title?.trim() || !body.category || !body.choices || body.choices.length < 2) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: título, categoría, y al menos 2 opciones" },
      { status: 400 },
    );
  }

  let id = body.id?.trim() || slugify(body.title);
  if (!id) id = `event_${Date.now()}`;

  const { data: existing } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (existing) id = `${id}_${Date.now().toString(36)}`;

  const row = {
    id,
    category: body.category,
    tier: body.tier ?? "medium",
    title: body.title,
    description: body.description ?? "",
    role: body.role ?? null,
    choices: body.choices,
  };

  const { data, error } = await supabaseAdmin.from("events").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ event: data });
}
