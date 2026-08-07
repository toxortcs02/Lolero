import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin.from("teams").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ teams: data });
}
