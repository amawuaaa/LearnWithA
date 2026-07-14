"use client";

import { NIVELES } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import {
  generarEjerciciosVocabulario,
  limpiarPalabras,
  palabrasValidas,
} from "@/lib/vocabulario";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const palabraVacia = () => ({
  termino: "",
  significado: "",
  pronunciacion: "",
  ejemplo: "",
});

export default function AdminVocabularyLessonForm({ leccion, onSaved }) {
  const [titulo, setTitulo] = useState(leccion?.titulo ?? "");
  const [tema, setTema] = useState(leccion?.tema ?? "");
  const [descripcion, setDescripcion] = useState(leccion?.descripcion ?? "");
  const [nivel, setNivel] = useState(leccion?.nivel ?? "A1");
  const [palabras, setPalabras] = useState(
    leccion?.palabras?.length
      ? leccion.palabras
      : Array.from({ length: 4 }, palabraVacia),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [temaIa, setTemaIa] = useState("");
  const [cantidadIa, setCantidadIa] = useState(8);
  const [generando, setGenerando] = useState(false);
  const [errorIa, setErrorIa] = useState("");
  const [confirmandoReemplazo, setConfirmandoReemplazo] = useState(false);

  function actualizarPalabra(indice, campo, valor) {
    setPalabras((actuales) =>
      actuales.map((palabra, posicion) =>
        posicion === indice ? { ...palabra, [campo]: valor } : palabra,
      ),
    );
  }

  function hayContenidoManual() {
    return (
      titulo.trim() ||
      tema.trim() ||
      descripcion.trim() ||
      palabras.some((palabra) =>
        Object.values(palabra).some((valor) => valor.trim()),
      )
    );
  }

  function generarConIa() {
    if (!temaIa.trim()) {
      setErrorIa("Describe el tema que quieres generar.");
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
      const respuesta = await fetch("/api/generar-vocabulario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tema: temaIa.trim(),
          nivel,
          cantidad: cantidadIa,
        }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorIa(datos.error ?? "No se pudo generar la lección.");
        return;
      }

      setTitulo(datos.titulo);
      setTema(datos.tema);
      setDescripcion(datos.descripcion);
      setPalabras(datos.palabras);
    } catch {
      setErrorIa("No se pudo conectar con el generador de IA.");
    } finally {
      setGenerando(false);
    }
  }

  async function guardar(event) {
    event.preventDefault();
    setError("");

    const palabrasLimpias = limpiarPalabras(palabras);
    if (
      !titulo.trim() ||
      !tema.trim() ||
      !descripcion.trim() ||
      !palabrasValidas(palabrasLimpias)
    ) {
      setError(
        "Completa entre 4 y 20 palabras. Los términos y significados no pueden repetirse.",
      );
      return;
    }

    setGuardando(true);
    const valores = {
      titulo: titulo.trim(),
      tema: tema.trim(),
      descripcion: descripcion.trim(),
      nivel,
      palabras: palabrasLimpias,
      ejercicios: generarEjerciciosVocabulario(palabrasLimpias),
      actualizado_en: new Date().toISOString(),
    };
    const supabase = createClient();
    const consulta = leccion
      ? supabase
          .from("lecciones_vocabulario")
          .update(valores)
          .eq("id", leccion.id)
      : supabase.from("lecciones_vocabulario").insert(valores);
    const { error: queryError } = await consulta;

    if (queryError) {
      setError("No se pudo guardar la lección.");
      setGuardando(false);
      return;
    }

    onSaved();
  }

  return (
    <form className="space-y-6" onSubmit={guardar}>
      <section className="rounded-xl border border-dashed border-accent/40 bg-accent-muted/40 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Generar lección con IA
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Describe el tema y la IA preparará el título, la introducción, las
          palabras, sus significados, pronunciaciones y ejemplos.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
          <input
            className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={temaIa}
            onChange={(event) => setTemaIa(event.target.value)}
            placeholder="Ej: vocabulario para viajar en avión"
            disabled={generando}
          />
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={cantidadIa}
            onChange={(event) => setCantidadIa(Number(event.target.value))}
            disabled={generando}
            aria-label="Cantidad de palabras"
          >
            {[4, 6, 8, 10, 12, 15, 20].map((cantidad) => (
              <option key={cantidad} value={cantidad}>
                {cantidad} palabras
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
          Se usará el nivel {nivel}. Podrás revisar y modificar todo antes de
          guardarlo.
        </p>
        {errorIa && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {errorIa}
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Título de la lección
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ej: En el supermercado"
            maxLength={120}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Tema
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            value={tema}
            onChange={(event) => setTema(event.target.value)}
            placeholder="Ej: Comida"
            maxLength={80}
            required
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Introducción
        <textarea
          className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="Explica brevemente qué aprenderá el alumno."
          maxLength={500}
          required
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Nivel
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent"
          value={nivel}
          onChange={(event) => setNivel(event.target.value)}
        >
          {NIVELES.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </label>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Palabras</h3>
            <p className="text-xs text-slate-500">
              Los ejercicios se crean automáticamente con sus significados.
            </p>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            type="button"
            disabled={palabras.length >= 20}
            onClick={() =>
              setPalabras((actuales) => [...actuales, palabraVacia()])
            }
          >
            Añadir palabra
          </button>
        </div>

        <div className="space-y-4">
          {palabras.map((palabra, indice) => (
            <article
              key={indice}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Palabra {indice + 1}
                </p>
                <button
                  className="text-xs font-medium text-red-600 hover:underline disabled:text-slate-400"
                  type="button"
                  disabled={palabras.length <= 4}
                  onClick={() =>
                    setPalabras((actuales) =>
                      actuales.filter((_, posicion) => posicion !== indice),
                    )
                  }
                >
                  Eliminar
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                  value={palabra.termino}
                  onChange={(event) =>
                    actualizarPalabra(indice, "termino", event.target.value)
                  }
                  placeholder="Término: apple"
                  required
                />
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                  value={palabra.significado}
                  onChange={(event) =>
                    actualizarPalabra(
                      indice,
                      "significado",
                      event.target.value,
                    )
                  }
                  placeholder="Significado: manzana"
                  required
                />
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                  value={palabra.pronunciacion}
                  onChange={(event) =>
                    actualizarPalabra(
                      indice,
                      "pronunciacion",
                      event.target.value,
                    )
                  }
                  placeholder="Pronunciación: /ˈæp.əl/"
                  required
                />
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                  value={palabra.ejemplo}
                  onChange={(event) =>
                    actualizarPalabra(indice, "ejemplo", event.target.value)
                  }
                  placeholder="Ejemplo: I eat an apple."
                  required
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        type="submit"
        disabled={guardando}
      >
        {guardando
          ? "Guardando…"
          : leccion
            ? "Guardar cambios"
            : "Crear lección"}
      </button>

      <ConfirmDialog
        abierto={confirmandoReemplazo}
        titulo="Reemplazar contenido"
        mensaje="La lección generada reemplazará los campos y las palabras actuales. ¿Continuar?"
        confirmLabel="Reemplazar"
        peligroso={false}
        onConfirm={ejecutarGeneracion}
        onCancel={() => setConfirmandoReemplazo(false)}
      />
    </form>
  );
}
