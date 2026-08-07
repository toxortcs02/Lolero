"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { useTeams } from "@/hooks/useTeams";
import { ROLES, ROLE_LABELS, STARTING_AGE } from "@/content/roles";
import { ROLE_SPECIAL_ATTRIBUTES, ATTRIBUTE_LABELS } from "@/content/attributes";
import type { Role } from "@/types/game";

export default function CrearPersonajePage() {
  const router = useRouter();
  const startCareer = useCareerStore((s) => s.startCareer);
  const teams = useTeams();

  const [nick, setNick] = useState("");
  const [role, setRole] = useState<Role>("mid");

  const canSubmit = nick.trim().length >= 2;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // El equipo se sortea recién al arrancar: se revela en /carrera, no acá.
    const team = teams[Math.floor(Math.random() * teams.length)];
    startCareer({
      nick: nick.trim(),
      role,
      team: team.name,
      league: "LCK Challengers",
      age: STARTING_AGE,
    });
    router.push("/carrera");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="hx-title text-2xl font-bold">Crear personaje</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="nick" className="hx-label text-xs font-medium">
            Nick
          </label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={20}
            placeholder="Ej: Faker"
            className="rounded-lg border border-hx-border bg-hx-black px-4 py-2 text-hx-gold-bright outline-none focus:border-hx-gold"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="hx-label text-xs font-medium">Posición</span>
          <div className="grid grid-cols-5 gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg border px-2 py-3 text-sm transition-colors ${
                  role === r
                    ? "border-hx-gold-bright bg-hx-gold text-hx-black"
                    : "border-hx-border text-hx-gold-bright hover:border-hx-gold"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <p className="text-xs text-hx-grey">
            Atributos especiales:{" "}
            {ROLE_SPECIAL_ATTRIBUTES[role]
              .map((id) => ATTRIBUTE_LABELS[id])
              .join(" · ")}
          </p>
        </div>

        <p className="text-xs text-hx-grey">
          Tu equipo inicial de LCK Challengers se sortea al arrancar la carrera.
        </p>

        <button type="submit" disabled={!canSubmit} className="hx-btn-primary rounded-full px-6 py-3">
          Empezar carrera
        </button>
      </form>
    </main>
  );
}
