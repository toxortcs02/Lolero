import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { EventDefinition } from "@/types/game";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }
  const { id } = await params;
  const body = (await request.json()) as Partial<EventDefinition>;

  if (body.choices !== undefined && body.choices.length < 2) {
    return NextResponse.json({ error: "El evento necesita al menos 2 opciones" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.category !== undefined) update.category = body.category;
  if (body.tier !== undefined) update.tier = body.tier;
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.role !== undefined) update.role = body.role || null;
  if (body.choices !== undefined) update.choices = body.choices;

  const { data, error } = await supabaseAdmin
    .from("events")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }
  const { id } = await params;

  const { error } = await supabaseAdmin.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
