"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <nav className="hx-panel flex items-center justify-between rounded-xl px-4 py-3">
        <div className="flex gap-4">
          <Link href="/admin/teams" className="hx-label text-xs font-medium">
            Equipos
          </Link>
          <Link href="/admin/events" className="hx-label text-xs font-medium">
            Eventos
          </Link>
        </div>
        <button onClick={handleLogout} className="text-xs text-hx-grey hover:text-hx-gold-bright">
          Cerrar sesión
        </button>
      </nav>
      {children}
    </div>
  );
}
