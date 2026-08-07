import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const { data: results } = supabase
    ? await supabase
        .from("career_results")
        .select("*")
        .order("score", { ascending: false })
        .limit(50)
    : { data: null };

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16">
      <h1 className="hx-title text-2xl font-bold">Ranking global</h1>
      {!results || results.length === 0 ? (
        <p className="text-hx-grey">
          Todavía no hay carreras retiradas en el ranking.
        </p>
      ) : (
        <ul className="hx-panel w-full max-w-md divide-y divide-hx-border rounded-lg">
          {results.map((r) => (
            <li key={r.id} className="flex justify-between px-4 py-2">
              <span className="text-hx-gold-bright">{r.nick}</span>
              <span className="text-hx-gold">{r.score}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
