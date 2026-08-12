"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCareerStore } from "@/store/careerStore";
import { getBigMoment } from "@/content/bigMoments";
import { ATTRIBUTE_LABELS } from "@/content/attributes";

export default function PartidoPage() {
  const router = useRouter();
  const character = useCareerStore((s) => s.character);
  const status = useCareerStore((s) => s.status);
  const pendingBigMoment = useCareerStore((s) => s.pendingBigMoment);
  const resolveBigMoment = useCareerStore((s) => s.resolveBigMoment);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!character || status !== "match" || !pendingBigMoment) {
      router.replace("/carrera");
    }
  }, [character, status, pendingBigMoment, router]);

  if (!character || !pendingBigMoment) return null;

  const bigMoment = getBigMoment(pendingBigMoment.bigMomentId);
  if (!bigMoment) return null;

  function handlePick(optionId: string) {
    if (rolling) return;
    setRolling(true);
    window.setTimeout(() => {
      resolveBigMoment(optionId);
      router.push("/carrera");
    }, 900);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <span className="hx-badge w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
        {pendingBigMoment.kind === "playoffs" ? "Momento decisivo · Playoffs" : "Momento decisivo · Internacional"}
      </span>

      <div className="hx-panel flex w-full flex-col gap-4 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="hx-title text-2xl font-bold sm:text-3xl">{bigMoment.title}</h1>
          <p className="text-base leading-relaxed text-hx-grey">{bigMoment.description}</p>
        </div>

        <div className="flex flex-col gap-2">
          {bigMoment.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={rolling}
              onClick={() => handlePick(option.id)}
              className="hx-choice flex items-center justify-between gap-3 rounded-lg px-5 py-4 text-left text-base disabled:opacity-50"
            >
              <span>{option.label}</span>
              <span className="hx-label whitespace-nowrap text-[10px]">{ATTRIBUTE_LABELS[option.statId]}</span>
            </button>
          ))}
        </div>

        {rolling && <p className="text-center text-sm text-hx-grey">Resolviendo la jugada...</p>}
      </div>
    </main>
  );
}
