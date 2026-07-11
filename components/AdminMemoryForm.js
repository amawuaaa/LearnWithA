"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const parVacio = () => ({ termino: "", pareja: "" });

export default function AdminMemoryForm({ juego, onSaved }) {
  const [titulo, setTitulo] = useState(juego?.titulo ?? "");
  const [pares, setPares] = useState(
    juego?.pares?.length ? juego.pares : [parVacio(), parVacio()],
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function actualizarPar(indice, cambios) {
    setPares((actuales) =>
      actuales.map((par, posicion) =>
        posicion === indice ? { ...par, ...cambios } : par,
      ),
    );
  }

  async function guardar(event) {
    event.preventDefault();
    setError("");

    const paresLimpios = pares.map((par) => ({
      termino: par.termino.trim(),
      pareja: par.pareja.trim(),
    }));

    const terminos = paresLimpios.map((par) => par.termino);
    const invalida =
      paresLimpios.length < 2 ||
      paresLimpios.some((par) => !par.termino || !par.pareja) ||
      new Set(terminos).size !== terminos.length;

    if (!titulo.trim() || invalida) {
      setError(
        "Añade al menos 2 parejas completas, con términos distintos entre sí.",
      );
      return;
    }

    setGuardando(true);
    const supabase = createClient();
    const valores = { titulo: titulo.trim(), pares: paresLimpios };
    const consulta = juego
      ? supabase.from("juegos_memoria").update(valores).eq("id", juego.id)
      : supabase.from("juegos_memoria").insert(valores);
    const { error: queryError } = await consulta;

    if (queryError) {
      setError("No se pudo guardar el juego.");
      setGuardando(false);
      return;
    }

    onSaved();
  }

  return (
    <form className="space-y-6" onSubmit={guardar}>
      <label className="block text-sm font-medium text-slate-700">
        Título del juego
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
        />
      </label>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Parejas de tarjetas
        </p>
        {pares.map((par, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
              value={par.termino}
              placeholder="Término"
              onChange={(event) =>
                actualizarPar(indice, { termino: event.target.value })
              }
              required
            />
            <input
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
              value={par.pareja}
              placeholder="Pareja"
              onChange={(event) =>
                actualizarPar(indice, { pareja: event.target.value })
              }
              required
            />
            {pares.length > 2 && (
              <button
                className="px-2 text-sm text-red-600"
                type="button"
                aria-label={`Eliminar pareja ${indice + 1}`}
                onClick={() =>
                  setPares((actuales) =>
                    actuales.filter((_, posicion) => posicion !== indice),
                  )
                }
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="text-sm font-medium text-accent hover:underline"
        type="button"
        onClick={() => setPares((actuales) => [...actuales, parVacio()])}
      >
        + Añadir pareja
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div>
        <button
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={guardando}
          type="submit"
        >
          {guardando
            ? "Guardando…"
            : juego
              ? "Guardar cambios"
              : "Crear juego"}
        </button>
      </div>
    </form>
  );
}
