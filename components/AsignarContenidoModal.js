"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Button from "./ui/Button";
import Modal from "./Modal";

/**
 * Modal para asignar un test o lección a uno o varios alumnos.
 * tipo: "test" | "leccion_vocabulario"
 */
export default function AsignarContenidoModal({
  abierto,
  onClose,
  onSaved,
  tipo,
  contenidoId,
  titulo,
  estudiantes,
  idsIniciales = [],
}) {
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;
    setSeleccionados(new Set(idsIniciales));
    setError("");
    // Solo al abrir el modal (contenidoId); no en cada render del array.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsIniciales al abrir
  }, [abierto, contenidoId]);

  function toggle(id) {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function seleccionarTodos() {
    setSeleccionados(new Set(estudiantes.map((estudiante) => estudiante.id)));
  }

  function quitarTodos() {
    setSeleccionados(new Set());
  }

  async function guardar() {
    setGuardando(true);
    setError("");
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      "guardar_asignaciones_contenido",
      {
        p_tipo: tipo,
        p_test_id: tipo === "test" ? contenidoId : null,
        p_leccion_id: tipo === "leccion_vocabulario" ? contenidoId : null,
        p_estudiante_ids: [...seleccionados],
      },
    );
    setGuardando(false);

    if (rpcError) {
      setError(
        rpcError.message?.includes("administradora")
          ? rpcError.message
          : "No se pudieron guardar las asignaciones. ¿Aplicaste la migración 028?",
      );
      return;
    }

    onSaved();
  }

  return (
    <Modal
      abierto={abierto}
      titulo={`Asignar: ${titulo}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Los alumnos asignados podrán hacer este contenido aunque su nivel
          CEFR sea inferior.
        </p>

        {estudiantes.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No hay alumnos registrados todavía.
          </p>
        ) : (
          <>
            <div className="flex gap-3">
              <Button
                type="button"
                variante="enlace"
                onClick={seleccionarTodos}
              >
                Todos
              </Button>
              <Button type="button" variante="enlace" onClick={quitarTodos}>
                Ninguno
              </Button>
            </div>

            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {estudiantes.map((estudiante) => {
                const marcado = seleccionados.has(estudiante.id);
                return (
                  <li key={estudiante.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggle(estudiante.id)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {estudiante.nombre}
                      </span>
                      <span className="text-xs text-slate-400">
                        {estudiante.nivel ?? "A1"}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variante="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={guardar}
            disabled={guardando || estudiantes.length === 0}
          >
            {guardando ? "Guardando…" : "Guardar asignación"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
