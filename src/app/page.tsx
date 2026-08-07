import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="hx-title text-5xl font-bold tracking-wide">Lolero</h1>
        <p className="max-w-md text-hx-grey">
          Empezá desde un equipo de LCK Challengers (2ª división coreana) y
          llevá tu carrera hasta la escena internacional de League of
          Legends.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/crear" className="hx-btn-primary rounded-full px-6 py-3">
          Jugar
        </Link>
        <Link
          href="/ranking"
          className="hx-btn-secondary rounded-full px-6 py-3 font-medium"
        >
          Ranking
        </Link>
      </div>
    </main>
  );
}
