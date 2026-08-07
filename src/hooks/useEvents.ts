"use client";

import { useEffect } from "react";
import { useCareerStore } from "@/store/careerStore";

/** Fetches events from Supabase (admin-edited) and pushes them into the
 *  career store, which falls back to the bundled static list until this
 *  resolves or if Supabase isn't configured. Call once per page that can
 *  trigger event selection (crear, carrera) — safe to call from both. */
export function useEvents() {
  const setEvents = useCareerStore((s) => s.setEvents);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/events")
      .then((res) => res.json())
      .then((data: { events?: unknown[] }) => {
        if (!cancelled && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events as Parameters<typeof setEvents>[0]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setEvents]);
}
