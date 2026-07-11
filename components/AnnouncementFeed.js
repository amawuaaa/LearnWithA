"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import AdminAnnouncementForm from "./AdminAnnouncementForm";
import Modal from "./Modal";

function ordenar(anuncios) {
  return [...anuncios].sort(
    (a, b) => new Date(b.creado_en) - new Date(a.creado_en),
  );
}

export default function AnnouncementFeed({
  initialAnnouncements,
  esAdmin,
  usuario,
}) {
  const [anuncios, setAnuncios] = useState(initialAnnouncements);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

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
        ]),
      );
    }

    const canal = supabase
      .channel("muro-anuncios")
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

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }

  function guardarLocal(anuncio) {
    setAnuncios((actuales) =>
      ordenar([
        anuncio,
        ...actuales.filter((actual) => actual.id !== anuncio.id),
      ]),
    );
    setModalAbierto(false);
  }

  async function borrar(anuncio) {
    if (!window.confirm(`¿Eliminar el anuncio “${anuncio.titulo}”?`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("anuncios")
      .delete()
      .eq("id", anuncio.id);

    if (error) {
      window.alert("No se pudo eliminar el anuncio.");
      return;
    }

    setAnuncios((actuales) =>
      actuales.filter((actual) => actual.id !== anuncio.id),
    );
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Noticias</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Muro de anuncios
          </h1>
          <p className="mt-2 text-slate-500">
            Novedades y avisos importantes de la clase.
          </p>
        </div>
        {esAdmin && (
          <button
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            type="button"
            onClick={abrirNuevo}
          >
            Nuevo anuncio
          </button>
        )}
      </div>

      <div className="space-y-4" aria-live="polite">
        {anuncios.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Todavía no hay anuncios.
          </div>
        )}

        {anuncios.map((anuncio) => (
          <article
            key={anuncio.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {anuncio.titulo}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {anuncio.usuarios?.nombre ?? "Profesora"} ·{" "}
                  <time suppressHydrationWarning>
                    {new Date(anuncio.creado_en).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </p>
              </div>

              {esAdmin && (
                <div className="flex gap-2">
                  <button
                    className="text-sm font-medium text-accent hover:underline"
                    type="button"
                    onClick={() => {
                      setEditando(anuncio);
                      setModalAbierto(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-sm font-medium text-red-600 hover:underline"
                    type="button"
                    onClick={() => borrar(anuncio)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
              {anuncio.contenido}
            </p>
          </article>
        ))}
      </div>

      <Modal
        abierto={modalAbierto}
        titulo={editando ? "Editar anuncio" : "Nuevo anuncio"}
        onClose={() => setModalAbierto(false)}
      >
        <AdminAnnouncementForm
          key={editando?.id ?? "nuevo"}
          anuncio={editando}
          autorId={usuario.id}
          autorNombre={usuario.nombre}
          onSaved={guardarLocal}
        />
      </Modal>
    </>
  );
}
