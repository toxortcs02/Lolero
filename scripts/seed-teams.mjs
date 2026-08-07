// One-off seed script. Run manually after applying the migrations:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-teams.mjs
// Uses the service role key (never the anon key) so it bypasses RLS.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Ids that existed under old names/rosters and no longer belong in the
// current team list — removed so re-running the seed doesn't leave
// stale rows behind.
const STALE_IDS = ["krx-c", "dns-c", "bfx-y", "bro-c"];

const CHALLENGERS_TEAMS = [
  { id: "ns-c", name: "NS Challengers", tag: "NS.C", primary_color: "#C8102E", secondary_color: "#000000", base_strength: 5 },
  { id: "kt-c", name: "KT Challengers", tag: "KT.C", primary_color: "#FF0000", secondary_color: "#000000", base_strength: 7 },
  { id: "drx-c", name: "DRX Challengers", tag: "DRX.C", primary_color: "#00A9E0", secondary_color: "#0B1F3A", base_strength: 6 },
  { id: "hle-c", name: "HLE Challengers", tag: "HLE.C", primary_color: "#FF6600", secondary_color: "#1B2A4A", base_strength: 7 },
  { id: "soop-c", name: "SOOPers Challengers", tag: "SOOP.C", primary_color: "#00C7AE", secondary_color: "#000000", base_strength: 5 },
  { id: "dplus-c", name: "Dplus Challengers", tag: "DPLUS.C", primary_color: "#00A19A", secondary_color: "#000000", base_strength: 6 },
  { id: "gen-ga", name: "Gen.G Global Academy", tag: "GEN.GA", primary_color: "#AA8B56", secondary_color: "#000000", base_strength: 9 },
  { id: "fearx-y", name: "FEARX Youth", tag: "FEARX.Y", primary_color: "#6E3FA3", secondary_color: "#000000", base_strength: 4 },
  { id: "brion-c", name: "BRION Challengers", tag: "BRION.C", primary_color: "#00A651", secondary_color: "#000000", base_strength: 6 },
  { id: "t1-a", name: "T1 Esports Academy", tag: "T1.A", primary_color: "#E2012D", secondary_color: "#000000", base_strength: 9 },
].map((t) => ({ ...t, league: "challengers" }));

// LCK (primera división) — mismo org que su hermano Challengers, un escalón
// arriba. `academyId` (no va a la DB) se usa más abajo solo para copiar
// crest_url/jersey_url del hermano — mismo escudo/camiseta real.
const LCK_TEAMS = [
  { id: "t1", academyId: "t1-a", name: "T1", tag: "T1", primary_color: "#E2012D", secondary_color: "#000000", base_strength: 10 },
  { id: "gen-g", academyId: "gen-ga", name: "Gen.G", tag: "GEN", primary_color: "#AA8B56", secondary_color: "#000000", base_strength: 10 },
  { id: "hle", academyId: "hle-c", name: "Hanwha Life Esports", tag: "HLE", primary_color: "#FF6600", secondary_color: "#1B2A4A", base_strength: 8 },
  { id: "kt", academyId: "kt-c", name: "KT Rolster", tag: "KT", primary_color: "#FF0000", secondary_color: "#000000", base_strength: 8 },
  { id: "dplus", academyId: "dplus-c", name: "Dplus KIA", tag: "DK", primary_color: "#00A19A", secondary_color: "#000000", base_strength: 7 },
  { id: "drx", academyId: "drx-c", name: "DRX", tag: "DRX", primary_color: "#00A9E0", secondary_color: "#0B1F3A", base_strength: 6 },
  { id: "ns", academyId: "ns-c", name: "Nongshim RedForce", tag: "NS", primary_color: "#C8102E", secondary_color: "#000000", base_strength: 6 },
  { id: "brion", academyId: "brion-c", name: "OKSavingsBank BRION", tag: "BRO", primary_color: "#00A651", secondary_color: "#000000", base_strength: 6 },
  { id: "soop", academyId: "soop-c", name: "SOOP", tag: "SOOP", primary_color: "#00C7AE", secondary_color: "#000000", base_strength: 5 },
  { id: "fearx", academyId: "fearx-y", name: "BNK FEARX", tag: "FOX", primary_color: "#6E3FA3", secondary_color: "#000000", base_strength: 5 },
];

const { error: deleteError } = await supabase.from("teams").delete().in("id", STALE_IDS);
if (deleteError) {
  console.error("Cleanup of stale rows failed:", deleteError.message);
  process.exit(1);
}

const { error: challengersError } = await supabase
  .from("teams")
  .upsert(CHALLENGERS_TEAMS, { onConflict: "id" });
if (challengersError) {
  console.error("Seed of Challengers teams failed:", challengersError.message);
  process.exit(1);
}

const lckRows = LCK_TEAMS.map(({ academyId, ...row }) => ({ ...row, league: "lck" }));
const { error: lckError } = await supabase.from("teams").upsert(lckRows, { onConflict: "id" });
if (lckError) {
  console.error("Seed of LCK teams failed:", lckError.message);
  process.exit(1);
}

// Copy crest/jersey from each Challengers team onto its LCK sibling — same
// real-world org, same kit, no need to re-upload via admin.
let copied = 0;
for (const { id, academyId } of LCK_TEAMS) {
  const { data: sibling, error: fetchError } = await supabase
    .from("teams")
    .select("crest_url, jersey_url")
    .eq("id", academyId)
    .maybeSingle();
  if (fetchError || !sibling || (!sibling.crest_url && !sibling.jersey_url)) continue;

  const { error: updateError } = await supabase
    .from("teams")
    .update({ crest_url: sibling.crest_url, jersey_url: sibling.jersey_url })
    .eq("id", id);
  if (updateError) {
    console.error(`Failed to copy assets ${academyId} -> ${id}:`, updateError.message);
    continue;
  }
  copied += 1;
}

console.log(
  `Seeded ${CHALLENGERS_TEAMS.length} Challengers + ${LCK_TEAMS.length} LCK teams ` +
    `(removed ${STALE_IDS.length} stale rows, copied assets for ${copied} LCK teams).`,
);
