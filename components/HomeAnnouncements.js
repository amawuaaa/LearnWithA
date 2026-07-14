"use client";

import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";

export default function HomeAnnouncements({ initialAnuncios }) {
  const [anuncios] = useAnnouncements(initialAnuncios, {
    limite: 3,
    canal: "muro-anuncios-inicio",
  });

  if (anuncios.length === 0) {
    return <EmptyState>Todavía no hay anuncios.</EmptyState>;
  }

  return (
    <div className="space-y-4" aria-live="polite">
      {anuncios.map((anuncio) => (
        <Card key={anuncio.id} className="p-6">
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
        </Card>
      ))}
    </div>
  );
}
