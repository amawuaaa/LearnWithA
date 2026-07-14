"use client";

import { NIVELES } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const parVacio = () => ({ termino: "", pareja: "", emoji: "" });

export default function AdminMemoryForm({ juego, onSaved }) {
  const [titulo, setTitulo] = useState(juego?.titulo ?? "");
  const [pares, setPares] = useState(
    juego?.pares?.length
      ? juego.pares
      : Array.from({ length: 8 }, parVacio),
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [temaIa, setTemaIa] = useState("");
  const [nivelIa, setNivelIa] = useState("A1");
  const [generando, setGenerando] = useState(false);
  const [errorIa, setErrorIa] = useState("");
  const [confirmandoReemplazo, setConfirmandoReemplazo] = useState(false);

  function actualizarPar(indice, cambios) {
    setPares((actuales) =>
      actuales.map((par, posicion) =>
        posicion === indice ? { ...par, ...cambios } : par,
      ),
    );
  }

  function hayContenidoManual() {
    return (
      titulo.trim() ||
      pares.some((par) =>
        Object.values(par).some((valor) => (valor ?? "").trim()),
      )
    );
  }

  function generarConIa() {
    if (!temaIa.trim()) {
      setErrorIa("Describe el tema del juego.");
      return;
    }
    if (hayContenidoManual()) {
      setConfirmandoReemplazo(true);
      return;
    }
    ejecutarGeneracion();
  }

  async function ejecutarGeneracion() {
    setConfirmandoReemplazo(false);
    setErrorIa("");
    setGenerando(true);

    try {
      const respuesta = await fetch("/api/generar-memoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tema: temaIa.trim(),
          nivel: nivelIa,
          cantidad: 8,
        }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorIa(datos.error ?? "No se pudo generar el juego.");
        return;
      }

      setTitulo(datos.titulo);
      setPares(datos.pares);
    } catch {
      setErrorIa("No se pudo conectar con el generador de IA.");
    } finally {
      setGenerando(false);
    }
  }

  async function guardar(event) {
    event.preventDefault();
    setError("");

    const paresLimpios = pares.map((par) => ({
      termino: par.termino.trim(),
      pareja: par.pareja.trim(),
      emoji: (par.emoji ?? "").trim(),
    }));

    const textos = paresLimpios.flatMap((par) => [
      par.termino.toLowerCase(),
      par.pareja.toLowerCase(),
    ]);
    const invalida =
      paresLimpios.length !== 8 ||
      paresLimpios.some((par) => !par.termino || !par.pareja || !par.emoji) ||
      new Set(textos).size !== textos.length;

    if (!titulo.trim() || invalida) {
      setError(
        "El tablero 4×4 necesita exactamente 8 parejas con textos únicos y un emoji para cada una.",
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
      <section className="rounded-xl border border-dashed border-accent/40 bg-accent-muted/40 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Generar juego con IA
        </p>
        <p className="mt-1 text-xs text-slate-500">
          La IA preparará las palabras, traducciones y emojis. Podrás revisarlo
          todo antes de guardar.
        </p>
        <input
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
          value={temaIa}
          onChange={(event) => setTemaIa(event.target.value)}
          placeholder="Ej: animales de la granja"
          disabled={generando}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={nivelIa}
            onChange={(event) => setNivelIa(event.target.value)}
            disabled={generando}
            aria-label="Nivel del juego"
          >
            {NIVELES.map((nivel) => (
              <option key={nivel} value={nivel}>
                Nivel {nivel}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            type="button"
            disabled={generando}
            onClick={generarConIa}
          >
            {generando ? "Generando…" : "Generar"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Se generarán 8 parejas para completar un tablero 4×4.
        </p>
        {errorIa && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {errorIa}
          </p>
        )}
      </section>

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
          Parejas de tarjetas · {pares.length}/8
        </p>
        {pares.map((par, indice) => (
          <div
            key={indice}
            className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_80px_auto]"
          >
            <input
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              value={par.termino}
              placeholder="Inglés: apple"
              onChange={(event) =>
                actualizarPar(indice, { termino: event.target.value })
              }
              required
            />
            <input
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
              value={par.pareja}
              placeholder="Español: manzana"
              onChange={(event) =>
                actualizarPar(indice, { pareja: event.target.value })
              }
              required
            />
            <input
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xl outline-none focus:border-accent"
              value={par.emoji ?? ""}
              placeholder="🍎"
              aria-label={`Emoji de la pareja ${indice + 1}`}
              onChange={(event) =>
                actualizarPar(indice, { emoji: event.target.value })
              }
              required
            />
            {pares.length > 8 && (
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
        disabled={pares.length >= 8}
        onClick={() => setPares((actuales) => [...actuales, parVacio()])}
      >
        {pares.length >= 8 ? "Tablero 4×4 completo" : "+ Añadir pareja"}
      </button>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div>
        <button
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
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

      <ConfirmDialog
        abierto={confirmandoReemplazo}
        titulo="Reemplazar contenido"
        mensaje="El juego generado reemplazará el título y las parejas actuales. ¿Continuar?"
        confirmLabel="Reemplazar"
        peligroso={false}
        onConfirm={ejecutarGeneracion}
        onCancel={() => setConfirmandoReemplazo(false)}
      />
    </form>
  );
}
