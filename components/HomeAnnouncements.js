"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

function ordenar(anuncios) {
  return [...anuncios].sort(
    (a, b) => new Date(b.creado_en) - new Date(a.creado_en),
  );
}

export default function HomeAnnouncements({ initialAnuncios }) {
  const [anuncios, setAnuncios] = useState(initialAnuncios);

  useEffect(() => {
    const supabase = createClient();

    async function sincronizar(payload) {
      if (payload.eventType === "DELETE") {
        setAnuncios((actuales) =>
          actuales.filter((anuncio) => anuncio.id !== payload.old.id),
        );
        return;
      }

      const { data } = await supabase
        .from("anuncios")
        .select("*, usuarios(nombre)")
        .eq("id", payload.new.id)
        .single();

      if (!data) return;

      setAnuncios((actuales) =>
        ordenar([
          data,
          ...actuales.filter((anuncio) => anuncio.id !== data.id),
        ]).slice(0, 3),
      );
    }

    const canal = supabase
      .channel("muro-anuncios-inicio")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "anuncios" },
        sincronizar,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  if (anuncios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Todavía no hay anuncios.
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      {anuncios.map((anuncio) => (
        <article
          key={anuncio.id}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            {anuncio.titulo}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {anuncio.usuarios?.nombre ?? "Profesora"} ·{" "}
            <time suppressHydrationWarning>
              {new Date(anuncio.creado_en).toLocaleString("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </p>
          <p className="mt-3 line-clamp-3 leading-7 text-slate-700">
            {anuncio.contenido}
          </p>
        </article>
      ))}
    </div>
  );
}
