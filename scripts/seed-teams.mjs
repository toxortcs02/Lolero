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
// current 10-team list — removed so re-running the seed doesn't leave
// stale rows behind.
const STALE_IDS = ["krx-c", "dns-c", "bfx-y", "bro-c"];

const TEAMS = [
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
];

const { error: deleteError } = await supabase.from("teams").delete().in("id", STALE_IDS);
if (deleteError) {
  console.error("Cleanup of stale rows failed:", deleteError.message);
  process.exit(1);
}

const { error } = await supabase.from("teams").upsert(TEAMS, { onConflict: "id" });

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${TEAMS.length} teams (removed ${STALE_IDS.length} stale rows).`);
