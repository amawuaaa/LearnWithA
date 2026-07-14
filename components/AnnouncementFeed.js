"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { ordenarAnuncios } from "@/lib/anuncios";
import { useAnnouncements } from "@/lib/hooks/useAnnouncements";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import AdminAnnouncementForm from "./AdminAnnouncementForm";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";

export default function AnnouncementFeed({
  initialAnnouncements,
  esAdmin,
  usuario,
}) {
  const [anuncios, setAnuncios] = useAnnouncements(initialAnnouncements, {
    canal: "muro-anuncios",
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }

  function guardarLocal(anuncio) {
    setAnuncios((actuales) =>
      ordenarAnuncios([
        anuncio,
        ...actuales.filter((actual) => actual.id !== anuncio.id),
      ]),
    );
    setModalAbierto(false);
  }

  async function confirmarBorrado() {
    setEliminando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("anuncios")
      .delete()
      .eq("id", borrando.id);
    setEliminando(false);

    if (error) {
      setErrorBorrado("No se pudo eliminar el anuncio.");
      return;
    }

    setAnuncios((actuales) =>
      actuales.filter((actual) => actual.id !== borrando.id),
    );
    setBorrando(null);
  }

  return (
    <>
      <PageHeader
        etiqueta="Noticias"
        titulo="Muro de anuncios"
        descripcion="Novedades y avisos importantes de la clase."
        accion={
          esAdmin ? (
            <Button className="shrink-0" type="button" onClick={abrirNuevo}>
              Nuevo anuncio
            </Button>
          ) : null
        }
      />

      <div className="space-y-4" aria-live="polite">
        {anuncios.length === 0 && (
          <EmptyState>Todavía no hay anuncios.</EmptyState>
        )}

        {anuncios.map((anuncio) => (
          <Card key={anuncio.id} className="p-6">
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
                  <Button
                    variante="enlace"
                    type="button"
                    onClick={() => {
                      setEditando(anuncio);
                      setModalAbierto(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variante="enlacePeligro"
                    type="button"
                    onClick={() => {
                      setErrorBorrado("");
                      setBorrando(anuncio);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
              {anuncio.contenido}
            </p>
          </Card>
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

      <ConfirmDialog
        abierto={borrando !== null}
        titulo="Eliminar anuncio"
        mensaje={`¿Eliminar el anuncio "${borrando?.titulo}"? Esta acción no se puede deshacer.`}
        cargando={eliminando}
        error={errorBorrado}
        onConfirm={confirmarBorrado}
        onCancel={() => setBorrando(null)}
      />
    </>
  );
}
