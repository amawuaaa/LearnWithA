"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminMemoryForm from "./AdminMemoryForm";
import MemoryGame from "./MemoryGame";
import Modal from "./Modal";

export default function MemoriaDashboard({
  juegos,
  esAdmin,
  estudianteId,
  resultados,
}) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  function abrir(juego = null) {
    setEditando(juego);
    setModalAbierto(true);
  }

  function guardado() {
    setModalAbierto(false);
    router.refresh();
  }

  async function borrar(juego) {
    if (!window.confirm(`¿Eliminar el juego “${juego.titulo}”?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("juegos_memoria")
      .delete()
      .eq("id", juego.id);

    if (error) {
      window.alert("No se pudo eliminar el juego.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Aprender jugando</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Memoria
          </h1>
          <p className="mt-2 text-slate-500">
            {esAdmin
              ? "Gestiona los juegos de memoria y consulta los resultados."
              : "Encuentra las parejas para repasar jugando."}
          </p>
        </div>
        {esAdmin && (
          <button
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            type="button"
            onClick={() => abrir()}
          >
            Crear juego de memoria
          </button>
        )}
      </div>

      {juegos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Todavía no hay juegos de memoria disponibles.
        </div>
      ) : esAdmin ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {juegos.map((juego) => (
            <article
              key={juego.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{juego.titulo}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {juego.pares.length} parejas
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  className="text-sm font-medium text-accent hover:underline"
                  type="button"
                  onClick={() => abrir(juego)}
                >
                  Editar
                </button>
                <button
                  className="text-sm font-medium text-red-600 hover:underline"
                  type="button"
                  onClick={() => borrar(juego)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {juegos.map((juego) => (
            <MemoryGame
              key={juego.id}
              juego={juego}
              estudianteId={estudianteId}
            />
          ))}
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
                  <th className="px-4 py-3 font-medium">Juego</th>
                  <th className="px-4 py-3 font-medium">Intentos</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultados.map((resultado) => (
                  <tr key={resultado.id}>
                    <td className="px-4 py-3">
                      {resultado.usuarios?.nombre ?? "Alumno"}
                    </td>
                    <td className="px-4 py-3">
                      {resultado.juegos_memoria?.titulo ?? "Juego eliminado"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {resultado.intentos}
                    </td>
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
                      colSpan="4"
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
        titulo={editando ? "Editar juego" : "Crear juego de memoria"}
        onClose={() => setModalAbierto(false)}
      >
        <AdminMemoryForm
          key={editando?.id ?? "nuevo"}
          juego={editando}
          onSaved={guardado}
        />
      </Modal>
    </>
  );
}
