"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ATTRIBUTE_LABELS,
  GENERAL_ATTRIBUTES,
  ROLE_SPECIAL_ATTRIBUTES,
  SPECIAL_ATTRIBUTES,
} from "@/content/attributes";
import { ROLES, ROLE_LABELS } from "@/content/roles";
import type {
  EventCategory,
  EventChoice,
  EventDefinition,
  EventTier,
  Relations,
  Role,
} from "@/types/game";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  transfers: "Mercado de pases",
  locker_room: "Vestuario",
  media: "Medios",
  personal: "Personal",
  competitive: "Competitivo",
  role_specific: "Específico de rol",
  international: "Internacional",
};
const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as EventCategory[];

const TIER_LABELS: Record<EventTier, string> = {
  minor: "Menor (±3-8)",
  medium: "Medio (±8-15)",
  major: "Mayor (±15-25)",
};
const TIER_KEYS = Object.keys(TIER_LABELS) as EventTier[];

const RELATION_LABELS: Record<keyof Relations, string> = {
  teamTrust: "Confianza equipo",
  fanLoyalty: "Fidelidad fans",
  prestige: "Prestigio",
  mentalHealth: "Salud mental",
};
const RELATION_KEYS = Object.keys(RELATION_LABELS) as (keyof Relations)[];

/** Every attribute id that currently exists in the game — used to drop any
 *  stale/renamed key (e.g. from an old seed) a saved event might still carry. */
const VALID_ATTRIBUTE_IDS: Set<string> = new Set([
  ...GENERAL_ATTRIBUTES.map((a) => a.id as string),
  ...SPECIAL_ATTRIBUTES.map((a) => a.id as string),
]);

function blankChoice(): EventChoice {
  return { id: `choice_${Math.random().toString(36).slice(2, 8)}`, label: "", effects: {}, resolution: "" };
}

function blankEvent(): EventDefinition {
  return {
    id: "",
    category: "locker_room",
    tier: "medium",
    title: "",
    description: "",
    choices: [blankChoice(), blankChoice()],
  };
}

/** Strips zero-valued deltas and any attribute id that no longer exists,
 *  so the saved payload only carries real, current effects. */
function cleanChoice(choice: EventChoice): EventChoice {
  const attributes = Object.fromEntries(
    Object.entries(choice.effects.attributes ?? {}).filter(
      ([k, v]) => v && VALID_ATTRIBUTE_IDS.has(k),
    ),
  );
  const relations = Object.fromEntries(
    Object.entries(choice.effects.relations ?? {}).filter(([, v]) => v),
  );
  return {
    ...choice,
    label: choice.label.trim(),
    resolution: choice.resolution.trim(),
    effects: {
      ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
      ...(Object.keys(relations).length > 0 ? { relations } : {}),
    },
  };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDefinition | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/events")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Error");
        return res.json();
      })
      .then((data: { events: EventDefinition[] }) => setEvents(data.events))
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    });
  }, [events, search, categoryFilter]);

  function startNew() {
    setDraft(blankEvent());
    setEditingId("__new__");
  }

  function startEdit(event: EventDefinition) {
    setDraft(structuredClone(event));
    setEditingId(event.id);
  }

  function startDuplicate(event: EventDefinition) {
    const copy = structuredClone(event);
    copy.id = "";
    copy.title = `${copy.title} (copia)`;
    setDraft(copy);
    setEditingId("__new__");
  }

  function cancelEdit() {
    setDraft(null);
    setEditingId(null);
  }

  function updateDraft(patch: Partial<EventDefinition>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  function updateChoice(index: number, patch: Partial<EventChoice>) {
    setDraft((d) => {
      if (!d) return d;
      const choices = d.choices.map((c, i) => (i === index ? { ...c, ...patch } : c));
      return { ...d, choices };
    });
  }

  function updateChoiceEffect(
    index: number,
    kind: "attributes" | "relations",
    key: string,
    value: number,
  ) {
    setDraft((d) => {
      if (!d) return d;
      const choices = d.choices.map((c, i) => {
        if (i !== index) return c;
        return { ...c, effects: { ...c.effects, [kind]: { ...c.effects[kind], [key]: value } } };
      });
      return { ...d, choices };
    });
  }

  function addChoice() {
    setDraft((d) => (d ? { ...d, choices: [...d.choices, blankChoice()] } : d));
  }

  function removeChoice(index: number) {
    setDraft((d) => (d ? { ...d, choices: d.choices.filter((_, i) => i !== index) } : d));
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return setError("Falta el título");
    if (draft.category === "role_specific" && !draft.role) {
      return setError("Elegí un rol para un evento específico de rol");
    }
    const choices = draft.choices.map(cleanChoice);
    if (choices.length < 2 || choices.some((c) => !c.label || !c.resolution)) {
      return setError("Cada opción necesita texto y una resolución, y hacen falta al menos 2");
    }

    setSaving(true);
    setError(null);
    try {
      const isNew = editingId === "__new__";
      const res = await fetch(isNew ? "/api/admin/events" : `/api/admin/events/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, choices }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      cancelEdit();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar este evento? No se puede deshacer.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-hx-grey">Cargando eventos...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="hx-title text-2xl font-bold">Eventos</h1>
        {!editingId && (
          <button onClick={startNew} className="hx-btn-primary rounded-full px-4 py-2 text-sm">
            + Nuevo evento
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {editingId ? (
        <EventForm
          draft={draft!}
          isNew={editingId === "__new__"}
          saving={saving}
          onChange={updateDraft}
          onChoiceChange={updateChoice}
          onChoiceEffectChange={updateChoiceEffect}
          onAddChoice={addChoice}
          onRemoveChoice={removeChoice}
          onSave={save}
          onCancel={cancelEdit}
        />
      ) : (
        <>
          <div className="hx-panel flex flex-wrap items-center gap-3 rounded-xl p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, id o descripción..."
              className="min-w-[220px] flex-1 rounded-lg border border-hx-border bg-hx-black px-3 py-2 text-sm text-hx-gold-bright outline-none focus:border-hx-gold"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as EventCategory | "all")}
              className="rounded-lg border border-hx-border bg-hx-black px-3 py-2 text-sm text-hx-gold-bright outline-none focus:border-hx-gold"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORY_KEYS.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <span className="text-xs text-hx-grey">
              {filtered.length} de {events.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="hx-panel flex flex-wrap items-center gap-3 rounded-xl p-3"
              >
                <div className="min-w-[200px] flex-1">
                  <div className="font-medium text-hx-gold-bright">{event.title}</div>
                  <div className="text-xs text-hx-grey">
                    {event.id} · {event.choices.length} opciones
                  </div>
                </div>
                <span className="hx-badge rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {CATEGORY_LABELS[event.category]}
                </span>
                {event.role && (
                  <span className="hx-badge rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    {ROLE_LABELS[event.role]}
                  </span>
                )}
                <span className="text-xs text-hx-grey">{TIER_LABELS[event.tier]}</span>
                <button
                  onClick={() => startEdit(event)}
                  className="hx-btn-secondary rounded-full px-3 py-1.5 text-xs"
                >
                  Editar
                </button>
                <button
                  onClick={() => startDuplicate(event)}
                  className="hx-btn-secondary rounded-full px-3 py-1.5 text-xs"
                >
                  Duplicar
                </button>
                <button
                  onClick={() => remove(event.id)}
                  className="rounded-full border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:border-red-500"
                >
                  Borrar
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-hx-grey">Ningún evento coincide con la búsqueda.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EventForm({
  draft,
  isNew,
  saving,
  onChange,
  onChoiceChange,
  onChoiceEffectChange,
  onAddChoice,
  onRemoveChoice,
  onSave,
  onCancel,
}: {
  draft: EventDefinition;
  isNew: boolean;
  saving: boolean;
  onChange: (patch: Partial<EventDefinition>) => void;
  onChoiceChange: (index: number, patch: Partial<EventChoice>) => void;
  onChoiceEffectChange: (
    index: number,
    kind: "attributes" | "relations",
    key: string,
    value: number,
  ) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const attributeOptions =
    draft.category === "role_specific"
      ? draft.role
        ? ROLE_SPECIAL_ATTRIBUTES[draft.role].map((id) => ({ id, label: ATTRIBUTE_LABELS[id] }))
        : SPECIAL_ATTRIBUTES.map((a) => ({ id: a.id, label: a.label }))
      : GENERAL_ATTRIBUTES.map((a) => ({ id: a.id, label: a.label }));

  return (
    <div className="hx-panel flex flex-col gap-4 rounded-xl p-4">
      <h2 className="hx-title text-lg font-bold">{isNew ? "Nuevo evento" : `Editando: ${draft.id}`}</h2>

      <div className="flex flex-col gap-2">
        <label className="hx-label text-xs font-medium">Título</label>
        <input
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="rounded-lg border border-hx-border bg-hx-black px-3 py-2 text-sm text-hx-gold-bright outline-none focus:border-hx-gold"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="hx-label text-xs font-medium">Descripción</label>
        <textarea
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="rounded-lg border border-hx-border bg-hx-black px-3 py-2 text-sm text-hx-gold-bright outline-none focus:border-hx-gold"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="hx-label text-xs font-medium">Categoría</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ category: cat })}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                draft.category === cat
                  ? "border-hx-gold-bright bg-hx-gold text-hx-black"
                  : "border-hx-border text-hx-gold-bright hover:border-hx-gold"
              }`}
            >
              {draft.category === cat ? "☑" : "☐"} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="hx-label text-xs font-medium">Tier (magnitud sugerida)</span>
        <div className="flex flex-wrap gap-2">
          {TIER_KEYS.map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => onChange({ tier })}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                draft.tier === tier
                  ? "border-hx-gold-bright bg-hx-gold text-hx-black"
                  : "border-hx-border text-hx-gold-bright hover:border-hx-gold"
              }`}
            >
              {draft.tier === tier ? "☑" : "☐"} {TIER_LABELS[tier]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="hx-label text-xs font-medium">
          Rol {draft.category === "role_specific" ? "(obligatorio)" : "(opcional)"}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ role: undefined })}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              !draft.role
                ? "border-hx-gold-bright bg-hx-gold text-hx-black"
                : "border-hx-border text-hx-gold-bright hover:border-hx-gold"
            }`}
          >
            {!draft.role ? "☑" : "☐"} Cualquier rol
          </button>
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onChange({ role })}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                draft.role === role
                  ? "border-hx-gold-bright bg-hx-gold text-hx-black"
                  : "border-hx-border text-hx-gold-bright hover:border-hx-gold"
              }`}
            >
              {draft.role === role ? "☑" : "☐"} {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="hx-divider" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="hx-label text-xs font-medium">Opciones y consecuencias</span>
          <button
            type="button"
            onClick={onAddChoice}
            className="hx-btn-secondary rounded-full px-3 py-1 text-xs"
          >
            + Agregar opción
          </button>
        </div>

        {draft.choices.map((choice, i) => (
          <div key={choice.id} className="hx-stat flex flex-col gap-2 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="hx-label text-[10px]">Opción {i + 1}</span>
              {draft.choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemoveChoice(i)}
                  className="text-[10px] text-red-400 hover:text-red-300"
                >
                  Eliminar opción
                </button>
              )}
            </div>

            <input
              value={choice.label}
              onChange={(e) => onChoiceChange(i, { label: e.target.value })}
              placeholder="Texto del botón"
              className="rounded-lg border border-hx-border bg-hx-black px-3 py-2 text-sm text-hx-gold-bright outline-none focus:border-hx-gold"
            />

            <div className="flex flex-col gap-1">
              <span className="hx-label text-[9px]">Atributos</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {attributeOptions.map((attr) => (
                  <label key={attr.id} className="flex flex-col gap-0.5 text-[10px] text-hx-grey">
                    <span className="leading-tight">{attr.label}</span>
                    <input
                      type="number"
                      value={choice.effects.attributes?.[attr.id] ?? 0}
                      onChange={(e) =>
                        onChoiceEffectChange(i, "attributes", attr.id, Number(e.target.value))
                      }
                      className="w-full rounded border border-hx-border bg-hx-black px-1.5 py-1 text-hx-gold-bright outline-none focus:border-hx-gold"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="hx-label text-[9px]">Relaciones</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RELATION_KEYS.map((key) => (
                  <label key={key} className="flex flex-col gap-0.5 text-[10px] text-hx-grey">
                    <span className="leading-tight">{RELATION_LABELS[key]}</span>
                    <input
                      type="number"
                      value={choice.effects.relations?.[key] ?? 0}
                      onChange={(e) =>
                        onChoiceEffectChange(i, "relations", key, Number(e.target.value))
                      }
                      className="w-full rounded border border-hx-border bg-hx-black px-1.5 py-1 text-hx-gold-bright outline-none focus:border-hx-gold"
                    />
                  </label>
                ))}
              </div>
            </div>

            <textarea
              value={choice.resolution}
              onChange={(e) => onChoiceChange(i, { resolution: e.target.value })}
              placeholder="Texto de resolución (se muestra después de elegir)"
              rows={2}
              className="rounded-lg border border-hx-border bg-hx-black px-3 py-2 text-xs text-hx-gold-bright outline-none focus:border-hx-gold"
            />

            <label className="flex items-center gap-2 text-[10px] text-hx-grey">
              <input
                type="checkbox"
                checked={!!choice.endsCareer}
                onChange={(e) => onChoiceChange(i, { endsCareer: e.target.checked })}
              />
              Esta opción termina la carrera
            </label>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="hx-btn-primary rounded-full px-6 py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={onCancel} className="hx-btn-secondary rounded-full px-6 py-2 text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}
