"use client";

import { nivelBadgeClase } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminVocabularyLessonForm from "./AdminVocabularyLessonForm";
import AsignarContenidoModal from "./AsignarContenidoModal";
import ConfirmDialog from "./ConfirmDialog";
import ContentDashboard from "./ContentDashboard";
import Modal from "./Modal";

export default function VocabularyDashboard({
  lecciones,
  contenidos,
  progresos,
  esAdmin,
  nivelUsuario,
  estudiantes = [],
  asignacionesPorLeccion = {},
}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");
  const [asignando, setAsignando] = useState(null);
  const progresoPorLeccion = new Map(
    progresos.map((progreso) => [progreso.leccion_id, progreso]),
  );

  function abrir(leccion = null) {
    setEditando(leccion);
    setModalAbierto(true);
  }

  async function eliminarLeccion() {
    if (!borrando) return;
    setEliminando(true);
    setErrorBorrado("");
    const supabase = createClient();
    const { error } = await supabase
      .from("lecciones_vocabulario")
      .delete()
      .eq("id", borrando.id);
    setEliminando(false);

    if (error) {
      setErrorBorrado("No se pudo eliminar la lección.");
      return;
    }

    setBorrando(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">
            Aprende y practica
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Vocabulario
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            {esAdmin
              ? "Crea lecciones y asígnalas a alumnos concretos cuando lo necesites."
              : "Explora lecciones por temas, estudia cada palabra en contexto y completa ejercicios."}
          </p>
        </div>
        {esAdmin && (
          <button
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            type="button"
            onClick={() => abrir()}
          >
            Crear lección
          </button>
        )}
      </div>

      {lecciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">
            Todavía no hay lecciones de vocabulario.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {esAdmin
              ? "Crea la primera lección temática para tus alumnos."
              : "La profesora añadirá nuevas lecciones próximamente."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lecciones.map((leccion) => {
            const asignados = asignacionesPorLeccion[leccion.id] ?? [];
            // La vista del alumno ya entrega palabras si nivel OK o asignado.
            const bloqueada = !esAdmin && !leccion.palabras;
            const progreso = progresoPorLeccion.get(leccion.id);

            return (
              <article
                key={leccion.id}
                className={`flex flex-col rounded-xl border p-5 ${
                  bloqueada
                    ? "border-dashed border-slate-300 bg-slate-50"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-accent-muted px-2.5 py-1 text-xs font-medium text-teal-700">
                      {leccion.tema}
                    </span>
                    <span className={nivelBadgeClase(leccion.nivel)}>
                      Nivel {leccion.nivel}
                    </span>
                    {!esAdmin && leccion.asignado && (
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                        Asignada
                      </span>
                    )}
                    {esAdmin && asignados.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {asignados.length} asignado
                        {asignados.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  {bloqueada && (
                    <span className="text-xl" aria-label="Bloqueada">
                      🔒
                    </span>
                  )}
                </div>

                <h2
                  className={`mt-4 text-xl font-semibold ${
                    bloqueada ? "text-slate-500" : "text-slate-900"
                  }`}
                >
                  {leccion.titulo}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {leccion.descripcion}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">
                    {bloqueada
                      ? `Disponible en nivel ${leccion.nivel} o si te la asignan`
                      : `${leccion.palabras?.length ?? 0} palabras`}
                  </span>
                  {progreso && (
                    <span className="font-medium text-emerald-700">
                      {progreso.puntuacion}/{progreso.total}
                    </span>
                  )}
                </div>

                {!bloqueada && (
                  <Link
                    className="mt-4 rounded-lg bg-accent-muted px-4 py-2.5 text-center text-sm font-semibold text-accent hover:bg-teal-100"
                    href={`/vocabulario/${leccion.id}`}
                  >
                    {progreso ? "Repasar lección" : "Abrir lección"}
                  </Link>
                )}

                {esAdmin && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="text-sm font-medium text-accent hover:underline"
                      type="button"
                      onClick={() => abrir(leccion)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-sm font-medium text-accent hover:underline"
                      type="button"
                      onClick={() => setAsignando(leccion)}
                    >
                      Asignar
                    </button>
                    <button
                      className="text-sm font-medium text-red-600 hover:underline"
                      type="button"
                      onClick={() => {
                        setErrorBorrado("");
                        setBorrando(leccion);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ContentDashboard
        contenidos={contenidos}
        tipoPagina="vocabulario"
        esAdmin={esAdmin}
        nivelUsuario={nivelUsuario}
        embebido
      />

      <Modal
        abierto={modalAbierto}
        titulo={editando ? "Editar lección" : "Crear lección"}
        onClose={() => setModalAbierto(false)}
      >
        <AdminVocabularyLessonForm
          key={editando?.id ?? "nueva"}
          leccion={editando}
          onSaved={() => {
            setModalAbierto(false);
            router.refresh();
          }}
        />
      </Modal>

      <AsignarContenidoModal
        abierto={asignando !== null}
        onClose={() => setAsignando(null)}
        onSaved={() => {
          setAsignando(null);
          router.refresh();
        }}
        tipo="leccion_vocabulario"
        contenidoId={asignando?.id}
        titulo={asignando?.titulo ?? ""}
        estudiantes={estudiantes}
        idsIniciales={
          asignando ? (asignacionesPorLeccion[asignando.id] ?? []) : []
        }
      />

      <ConfirmDialog
        abierto={borrando !== null}
        titulo="Eliminar lección"
        mensaje={`¿Eliminar "${borrando?.titulo}" y el progreso asociado? Esta acción no se puede deshacer.`}
        cargando={eliminando}
        error={errorBorrado}
        onConfirm={eliminarLeccion}
        onCancel={() => setBorrando(null)}
      />
    </>
  );
}
