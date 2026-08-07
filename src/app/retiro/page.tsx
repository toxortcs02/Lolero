"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { ROLE_LABELS } from "@/content/roles";
import type { CareerResult, RetirementReason } from "@/types/game";

const RETIREMENT_REASON_LABELS: Record<RetirementReason, string> = {
  voluntary: "Te retiraste por decisión propia.",
  stats: "Tu equipo te cortó: tocaste fondo en confianza o salud mental.",
  age: "Te retiraste al llegar al límite de edad competitiva (30 años).",
};

function computeScore(
  relations: { teamTrust: number; fanLoyalty: number; prestige: number; mentalHealth: number },
  attributes: Record<string, number>,
  seasonsPlayed: number,
) {
  const attributeSum = Object.values(attributes).reduce((a, b) => a + b, 0);
  return Math.round(
    relations.prestige * 2 +
      relations.fanLoyalty +
      relations.teamTrust +
      relations.mentalHealth +
      attributeSum / 5 +
      seasonsPlayed * 10,
  );
}

export default function RetiroPage() {
  const router = useRouter();
  const character = useCareerStore((s) => s.character);
  const season = useCareerStore((s) => s.season);
  const attributes = useCareerStore((s) => s.attributes);
  const relations = useCareerStore((s) => s.relations);
  const history = useCareerStore((s) => s.history);
  const retirementReason = useCareerStore((s) => s.retirementReason);
  const lastResolution = useCareerStore((s) => s.lastResolution);
  const reset = useCareerStore((s) => s.reset);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!character) router.replace("/");
  }, [character, router]);

  if (!character) return null;

  const score = computeScore(relations, attributes, season);

  async function handleSubmit() {
    if (!character) return;
    setSubmitting(true);
    setError(null);
    const result: CareerResult = {
      nick: character.nick,
      role: character.role,
      finalTeam: character.team,
      finalLeague: character.league,
      seasonsPlayed: season,
      score,
      summary: { relations, attributes, history },
    };
    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error desconocido");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el resultado");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewCareer() {
    reset();
    router.push("/crear");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="hx-title text-2xl font-bold">Retiro de {character.nick}</h1>
        <p className="text-hx-grey">
          {ROLE_LABELS[character.role]} · {character.team} · {character.age}{" "}
          años · {season} temporada{season !== 1 ? "s" : ""} jugadas
        </p>
        {retirementReason && (
          <p className="mt-1 text-sm text-hx-grey/80">
            {retirementReason === "voluntary" && lastResolution
              ? lastResolution
              : RETIREMENT_REASON_LABELS[retirementReason]}
          </p>
        )}
      </div>

      <div className="hx-panel rounded-lg px-4 py-3">
        <div className="hx-label text-xs">Puntaje final</div>
        <div className="text-3xl font-bold text-hx-gold-bright">{score}</div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="hx-label text-xs font-medium">Historial de decisiones</h2>
        <ul className="flex flex-col gap-1 text-sm text-hx-grey">
          {history.map((h, i) => (
            <li key={i}>
              Temporada {h.season}: {h.label}
            </li>
          ))}
          {history.length === 0 && <li>No tomaste decisiones esta carrera.</li>}
        </ul>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="hx-btn-primary rounded-full px-6 py-3"
          >
            {submitting ? "Subiendo..." : "Subir resultado al ranking"}
          </button>
        ) : (
          <p className="text-sm text-emerald-400">
            Resultado subido al ranking global.
          </p>
        )}
        <button onClick={handleNewCareer} className="hx-btn-secondary rounded-full px-6 py-3 font-medium">
          Empezar una nueva carrera
        </button>
      </div>
    </main>
  );
}
