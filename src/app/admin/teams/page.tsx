"use client";

import { useEffect, useState } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import type { TeamDefinition } from "@/content/teams";

function normalize(row: Record<string, unknown>): TeamDefinition {
  return {
    id: row.id as string,
    name: row.name as string,
    tag: row.tag as string,
    league: ((row.league as string) ?? "challengers") as "challengers" | "lck",
    primaryColor: (row.primary_color as string) ?? "#888888",
    secondaryColor: (row.secondary_color as string) ?? "#000000",
    colorConfirmed: true,
    crestUrl: (row.crest_url as string) ?? undefined,
    jerseyUrl: (row.jersey_url as string) ?? undefined,
    baseStrength: (row.base_strength as number) ?? 5,
  };
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Error");
        return res.json();
      })
      .then((data: { teams: Record<string, unknown>[] }) => {
        setTeams(data.teams.map(normalize));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar"))
      .finally(() => setLoading(false));
  }, []);

  async function saveColors(team: TeamDefinition) {
    setSavingId(team.id);
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: team.primaryColor,
          secondaryColor: team.secondaryColor,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSavingId(null);
    }
  }

  async function uploadAsset(teamId: string, type: "crest" | "jersey", file: File) {
    setSavingId(teamId);
    try {
      const form = new FormData();
      form.append("type", type);
      form.append("file", file);
      const res = await fetch(`/api/admin/teams/${teamId}/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      const data = (await res.json()) as { team: Record<string, unknown> };
      setTeams((prev) => prev.map((t) => (t.id === teamId ? normalize(data.team) : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally {
      setSavingId(null);
    }
  }

  function updateLocalColor(teamId: string, field: "primaryColor" | "secondaryColor", value: string) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, [field]: value } : t)));
  }

  if (loading) return <p className="text-hx-grey">Cargando equipos...</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="hx-title text-2xl font-bold">Equipos</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-3">
        {teams.map((team) => (
          <div key={team.id} className="hx-panel flex flex-wrap items-center gap-4 rounded-xl p-4">
            <TeamBadge team={team} size={64} />

            <div className="min-w-[180px] flex-1">
              <div className="font-medium text-hx-gold-bright">{team.name}</div>
              <div className="text-xs text-hx-grey">{team.tag}</div>
            </div>

            <label className="flex items-center gap-2 text-xs text-hx-grey">
              Primario
              <input
                type="color"
                value={team.primaryColor}
                onChange={(e) => updateLocalColor(team.id, "primaryColor", e.target.value)}
                onBlur={() => saveColors(team)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-hx-grey">
              Secundario
              <input
                type="color"
                value={team.secondaryColor}
                onChange={(e) => updateLocalColor(team.id, "secondaryColor", e.target.value)}
                onBlur={() => saveColors(team)}
              />
            </label>

            <label className="hx-btn-secondary cursor-pointer rounded-full px-3 py-1.5 text-xs">
              Subir escudo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAsset(team.id, "crest", file);
                }}
              />
            </label>
            <label className="hx-btn-secondary cursor-pointer rounded-full px-3 py-1.5 text-xs">
              Subir camiseta
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAsset(team.id, "jersey", file);
                }}
              />
            </label>

            {savingId === team.id && <span className="text-xs text-hx-grey">Guardando...</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
