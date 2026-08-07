import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "team-assets";
const ALLOWED_TYPES = new Set(["crest", "jersey"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 503 });
  }
  const { id } = await params;

  const form = await request.formData();
  const file = form.get("file");
  const assetType = form.get("type");

  if (!(file instanceof File) || typeof assetType !== "string" || !ALLOWED_TYPES.has(assetType)) {
    return NextResponse.json({ error: "Archivo o tipo inválido" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${id}/${assetType}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the browser picks up re-uploads immediately.
  const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const column = assetType === "crest" ? "crest_url" : "jersey_url";
  const { data, error } = await supabaseAdmin
    .from("teams")
    .update({ [column]: publicUrl })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}
