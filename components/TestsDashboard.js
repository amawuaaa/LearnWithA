"use client";

import { nivelBadgeClase, nivelDesbloqueado } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminTestForm from "./AdminTestForm";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";
import TestPlayer from "./TestPlayer";
import Button from "./ui/Button";
import Card from "./ui/Card";
import EmptyState from "./ui/EmptyState";
import PageHeader from "./ui/PageHeader";

export default function TestsDashboard({
  tests,
  esAdmin,
  nivelUsuario,
  resultados,
}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");

  function abrir(test = null) {
    setEditando(test);
    setModalAbierto(true);
  }

  function guardado() {
    setModalAbierto(false);
    router.refresh();
  }

  async function confirmarBorrado() {
    setEliminando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tests")
      .delete()
      .eq("id", borrando.id);
    setEliminando(false);

    if (error) {
      setErrorBorrado("No se pudo eliminar el test.");
      return;
    }
    setBorrando(null);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        etiqueta="Práctica"
        titulo="Tests"
        descripcion={
          esAdmin
            ? "Gestiona los tests y consulta los resultados."
            : "Responde los mini-tests y comprueba tu progreso."
        }
        accion={
          esAdmin ? (
            <Button className="shrink-0" type="button" onClick={() => abrir()}>
              Crear test
            </Button>
          ) : null
        }
      />

      {tests.length === 0 ? (
        <EmptyState>Todavía no hay tests disponibles.</EmptyState>
      ) : esAdmin ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="p-5">
              <span className={nivelBadgeClase(test.nivel)}>
                Nivel {test.nivel}
              </span>
              <h2 className="mt-2 font-semibold text-slate-900">
                {test.titulo}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {test.preguntas.length} preguntas
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  className="text-sm font-medium text-accent hover:underline"
                  type="button"
                  onClick={() => abrir(test)}
                >
                  Editar
                </button>
                <button
                  className="text-sm font-medium text-red-600 hover:underline"
                  type="button"
                  onClick={() => {
                    setErrorBorrado("");
                    setBorrando(test);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) =>
            nivelDesbloqueado(test.nivel, nivelUsuario) ? (
              <TestPlayer key={test.id} test={test} />
            ) : (
              <article
                key={test.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"
              >
                <div>
                  <span className={nivelBadgeClase(test.nivel)}>
                Nivel {test.nivel}
              </span>
                  <h2 className="mt-2 font-semibold text-slate-500">
                    {test.titulo}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Se desbloquea al alcanzar el nivel {test.nivel}.
                  </p>
                </div>
                <span aria-hidden="true" className="text-2xl">
                  🔒
                </span>
              </article>
            ),
          )}
        </div>
      )}

      {esAdmin && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Resultados de alumnos
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Alumno</th>
                  <th className="px-4 py-3 font-medium">Test</th>
                  <th className="px-4 py-3 font-medium">Mejor puntuación</th>
                  <th className="px-4 py-3 font-medium">Intentos</th>
                  <th className="px-4 py-3 font-medium">Último intento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultados.map((resultado) => (
                  <tr key={resultado.id}>
                    <td className="px-4 py-3">
                      {resultado.usuarios?.nombre ?? "Alumno"}
                    </td>
                    <td className="px-4 py-3">
                      {resultado.tests?.titulo ?? "Test eliminado"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {resultado.puntuacion} /{" "}
                      {resultado.tests?.preguntas?.length ?? "—"}
                    </td>
                    <td className="px-4 py-3">{resultado.intentos}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <time suppressHydrationWarning>
                        {new Date(resultado.completado_en).toLocaleDateString(
                          "es-ES",
                        )}
                      </time>
                    </td>
                  </tr>
                ))}
                {resultados.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan="5"
                    >
                      Aún no hay resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        abierto={modalAbierto}
        titulo={editando ? "Editar test" : "Crear test"}
        onClose={() => setModalAbierto(false)}
      >
        <AdminTestForm
          key={editando?.id ?? "nuevo"}
          test={editando}
          onSaved={guardado}
        />
      </Modal>

      <ConfirmDialog
        abierto={borrando !== null}
        titulo="Eliminar test"
        mensaje={`¿Eliminar el test "${borrando?.titulo}"? Esta acción no se puede deshacer.`}
        cargando={eliminando}
        error={errorBorrado}
        onConfirm={confirmarBorrado}
        onCancel={() => setBorrando(null)}
      />
    </>
  );
}
