"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import {
  IconAnuncios,
  IconCalendario,
  IconInicio,
  IconMemoria,
  IconMensajes,
  IconProgreso,
  IconTests,
  IconVocabulario,
} from "./icons";

const enlaces = [
  { href: "/", etiqueta: "Inicio", Icono: IconInicio },
  { href: "/calendario", etiqueta: "Calendario", Icono: IconCalendario },
  { href: "/anuncios", etiqueta: "Anuncios", Icono: IconAnuncios },
  { href: "/mensajes", etiqueta: "Mensajes", Icono: IconMensajes },
  { href: "/tests", etiqueta: "Tests", Icono: IconTests },
  { href: "/memoria", etiqueta: "Memoria", Icono: IconMemoria },
  { href: "/vocabulario", etiqueta: "Vocabulario", Icono: IconVocabulario },
  {
    href: "/progreso",
    etiqueta: "Progreso",
    Icono: IconProgreso,
    soloAdmin: true,
  },
];

export default function Sidebar({ perfil, mensajesNoLeidos = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [noLeidos, setNoLeidos] = useState(mensajesNoLeidos);

  useEffect(() => {
    setNoLeidos(mensajesNoLeidos);
  }, [mensajesNoLeidos]);

  useEffect(() => {
    const supabase = createClient();

    async function actualizarNoLeidos() {
      let consulta = supabase
        .from("mensajes")
        .select("id", { count: "exact", head: true })
        .is("leido_en", null)
        .neq("remitente_id", perfil.id);

      if (perfil.rol !== "admin") {
        consulta = consulta.eq("estudiante_id", perfil.id);
      }

      const { count } = await consulta;
      if (count !== null) setNoLeidos(count);
    }

    const canal = supabase
      .channel(`sidebar-mensajes-${perfil.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes" },
        actualizarNoLeidos,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [perfil.id, perfil.rol]);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const contenido = (
    <>
      <div className="border-b border-slate-200 px-5 py-6">
        <p className="text-xl font-semibold tracking-tight text-slate-900">
          Learn<span className="text-accent">WithA</span>
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
        {enlaces
          .filter((enlace) => !enlace.soloAdmin || perfil.rol === "admin")
          .map((enlace) => {
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
                  ? "bg-accent-muted text-accent"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md ${
                  activo ? "bg-accent-soft" : "bg-slate-100"
                }`}
              >
                <enlace.Icono className="h-4 w-4" />
              </span>
              <span className="flex-1">{enlace.etiqueta}</span>
              {enlace.href === "/mensajes" && noLeidos > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                  {noLeidos > 99 ? "99+" : noLeidos}
                </span>
              )}
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
        <p className="font-semibold text-slate-900">
          Learn<span className="text-accent">WithA</span>
        </p>
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
