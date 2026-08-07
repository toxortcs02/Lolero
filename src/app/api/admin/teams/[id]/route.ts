import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }
  const { id } = await params;
  const body = (await request.json()) as {
    primaryColor?: string;
    secondaryColor?: string;
  };

  const update: Record<string, string> = {};
  if (body.primaryColor) update.primary_color = body.primaryColor;
  if (body.secondaryColor) update.secondary_color = body.secondaryColor;

  const { data, error } = await supabaseAdmin
    .from("teams")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}
