"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "./Avatar";

const enlaces = [
  { href: "/", etiqueta: "Noticias", icono: "N" },
  { href: "/tests", etiqueta: "Tests", icono: "T" },
  { href: "/juegos", etiqueta: "Juegos", icono: "J" },
  { href: "/memoria", etiqueta: "Memoria", icono: "M" },
  { href: "/vocabulario", etiqueta: "Vocabulario", icono: "V" },
];

export default function Sidebar({ perfil }) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const contenido = (
    <>
      <div className="border-b border-slate-200 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Portal
        </p>
        <p className="mt-1 text-xl font-semibold text-slate-900">Mi clase</p>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
        {enlaces.map((enlace) => {
          const activo =
            enlace.href === "/"
              ? pathname === "/"
              : pathname.startsWith(enlace.href);

          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={() => setAbierto(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                activo
                  ? "bg-indigo-50 text-accent"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
                  activo ? "bg-indigo-100" : "bg-slate-100"
                }`}
              >
                {enlace.icono}
              </span>
              {enlace.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <Link
          className="mb-3 flex items-center gap-3 rounded-lg p-2 hover:bg-slate-100"
          href="/perfil"
          onClick={() => setAbierto(false)}
        >
          <Avatar nombre={perfil.nombre} url={perfil.avatar_url} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {perfil.nombre}
            </p>
            <p className="mt-0.5 text-xs capitalize text-slate-500">
              Ver perfil · {perfil.rol}
            </p>
          </div>
        </Link>
        <button
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          type="button"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <p className="font-semibold text-slate-900">Portal de Clase</p>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
          type="button"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? "Cerrar" : "Menú"}
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        {contenido}
      </aside>

      {abierto && (
        <>
          <button
            className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
            aria-label="Cerrar menú"
            type="button"
            onClick={() => setAbierto(false)}
          />
          <aside
            id="menu-movil"
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl md:hidden"
          >
            {contenido}
          </aside>
        </>
      )}
    </>
  );
}
