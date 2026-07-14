"use client";

import { NIVELES } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const preguntaVacia = () => ({
  pregunta: "",
  opciones: ["", ""],
  respuesta_correcta: "",
});

export default function AdminTestForm({ test, onSaved }) {
  const [titulo, setTitulo] = useState(test?.titulo ?? "");
  const [nivel, setNivel] = useState(test?.nivel ?? "A1");
  const [preguntas, setPreguntas] = useState(
    test?.preguntas?.length ? test.preguntas : [preguntaVacia()],
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [tema, setTema] = useState("");
  const [generando, setGenerando] = useState(false);
  const [errorIa, setErrorIa] = useState("");
  const [confirmandoReemplazo, setConfirmandoReemplazo] = useState(false);

  function hayContenidoManual() {
    return (
      titulo.trim() !== "" ||
      preguntas.some(
        (pregunta) =>
          pregunta.pregunta.trim() !== "" ||
          pregunta.opciones.some((opcion) => opcion.trim() !== ""),
      )
    );
  }

  function generarConIa() {
    const temaLimpio = tema.trim();
    if (!temaLimpio) {
      setErrorIa("Escribe un tema para generar el test.");
      return;
    }

    if (hayContenidoManual()) {
      setConfirmandoReemplazo(true);
      return;
    }

    ejecutarGeneracion();
  }

  async function ejecutarGeneracion() {
    const temaLimpio = tema.trim();
    setConfirmandoReemplazo(false);
    setErrorIa("");
    setGenerando(true);

    try {
      const respuesta = await fetch("/api/generar-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: temaLimpio, numPreguntas: 5 }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorIa(datos.error ?? "No se pudo generar el test.");
        return;
      }

      setTitulo(datos.titulo ?? temaLimpio);
      setPreguntas(
        datos.preguntas?.length ? datos.preguntas : [preguntaVacia()],
      );
    } catch {
      setErrorIa("No se pudo generar el test.");
    } finally {
      setGenerando(false);
    }
  }

  function actualizarPregunta(indice, cambios) {
    setPreguntas((actuales) =>
      actuales.map((pregunta, posicion) =>
        posicion === indice ? { ...pregunta, ...cambios } : pregunta,
      ),
    );
  }

  function actualizarOpcion(indicePregunta, indiceOpcion, valor) {
    setPreguntas((actuales) =>
      actuales.map((pregunta, posicion) => {
        if (posicion !== indicePregunta) return pregunta;
        const opciones = pregunta.opciones.map((opcion, indice) =>
          indice === indiceOpcion ? valor : opcion,
        );
        const respuesta_correcta =
          pregunta.respuesta_correcta === pregunta.opciones[indiceOpcion]
            ? valor
            : pregunta.respuesta_correcta;
        return { ...pregunta, opciones, respuesta_correcta };
      }),
    );
  }

  async function guardar(event) {
    event.preventDefault();
    setError("");

    const preguntasLimpias = preguntas.map((pregunta) => ({
      pregunta: pregunta.pregunta.trim(),
      opciones: pregunta.opciones.map((opcion) => opcion.trim()),
      respuesta_correcta: pregunta.respuesta_correcta.trim(),
    }));

    const invalida = preguntasLimpias.some(
      (pregunta) =>
        !pregunta.pregunta ||
        pregunta.opciones.length < 2 ||
        pregunta.opciones.some((opcion) => !opcion) ||
        new Set(pregunta.opciones).size !== pregunta.opciones.length ||
        !pregunta.opciones.includes(pregunta.respuesta_correcta),
    );

    if (!titulo.trim() || invalida) {
      setError(
        "Completa cada pregunta con opciones distintas y marca una respuesta correcta.",
      );
      return;
    }

    setGuardando(true);
    const supabase = createClient();
    const valores = {
      titulo: titulo.trim(),
      nivel,
      preguntas: preguntasLimpias,
    };
    const consulta = test
      ? supabase.from("tests").update(valores).eq("id", test.id)
      : supabase.from("tests").insert(valores);
    const { error: queryError } = await consulta;

    if (queryError) {
      setError("No se pudo guardar el test.");
      setGuardando(false);
      return;
    }

    onSaved();
  }

  return (
    <form className="space-y-6" onSubmit={guardar}>
      <div className="rounded-xl border border-dashed border-accent/40 bg-accent-muted/40 p-4">
        <label className="block text-sm font-medium text-slate-700">
          Generar con IA
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="Ej: verbos irregulares en pasado, nivel B1"
              value={tema}
              onChange={(event) => setTema(event.target.value)}
              disabled={generando}
            />
            <button
              className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              type="button"
              onClick={generarConIa}
              disabled={generando}
            >
              {generando ? "Generando…" : "Generar"}
            </button>
          </div>
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Genera 5 preguntas de ejemplo que puedes revisar y editar antes de guardar.
        </p>
        {errorIa && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {errorIa}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Título del test
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
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
      </div>

      <div className="space-y-5">
        {preguntas.map((pregunta, indicePregunta) => (
          <fieldset
            key={indicePregunta}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <legend className="font-medium text-slate-800">
                Pregunta {indicePregunta + 1}
              </legend>
              {preguntas.length > 1 && (
                <button
                  className="text-sm text-red-600 hover:underline"
                  type="button"
                  onClick={() =>
                    setPreguntas((actuales) =>
                      actuales.filter((_, indice) => indice !== indicePregunta),
                    )
                  }
                >
                  Quitar
                </button>
              )}
            </div>

            <textarea
              className="mb-4 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
              placeholder="Escribe la pregunta"
              value={pregunta.pregunta}
              onChange={(event) =>
                actualizarPregunta(indicePregunta, {
                  pregunta: event.target.value,
                })
              }
              required
            />

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Opciones (marca la correcta)
            </p>
            <div className="space-y-2">
              {pregunta.opciones.map((opcion, indiceOpcion) => (
                <div key={indiceOpcion} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correcta-${indicePregunta}`}
                    checked={
                      opcion !== "" && pregunta.respuesta_correcta === opcion
                    }
                    onChange={() =>
                      actualizarPregunta(indicePregunta, {
                        respuesta_correcta: opcion,
                      })
                    }
                    aria-label={`Marcar opción ${indiceOpcion + 1} como correcta`}
                  />
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                    value={opcion}
                    placeholder={`Opción ${indiceOpcion + 1}`}
                    onChange={(event) =>
                      actualizarOpcion(
                        indicePregunta,
                        indiceOpcion,
                        event.target.value,
                      )
                    }
                    required
                  />
                  {pregunta.opciones.length > 2 && (
                    <button
                      className="px-2 text-sm text-red-600"
                      type="button"
                      aria-label={`Eliminar opción ${indiceOpcion + 1}`}
                      onClick={() =>
                        actualizarPregunta(indicePregunta, {
                          opciones: pregunta.opciones.filter(
                            (_, indice) => indice !== indiceOpcion,
                          ),
                          respuesta_correcta:
                            pregunta.respuesta_correcta === opcion
                              ? ""
                              : pregunta.respuesta_correcta,
                        })
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="mt-3 text-sm font-medium text-accent hover:underline"
              type="button"
              onClick={() =>
                actualizarPregunta(indicePregunta, {
                  opciones: [...pregunta.opciones, ""],
                })
              }
            >
              + Añadir opción
            </button>
          </fieldset>
        ))}
      </div>

      <button
        className="text-sm font-medium text-accent hover:underline"
        type="button"
        onClick={() =>
          setPreguntas((actuales) => [...actuales, preguntaVacia()])
        }
      >
        + Añadir pregunta
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
          {guardando ? "Guardando…" : test ? "Guardar cambios" : "Crear test"}
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmandoReemplazo}
        titulo="Reemplazar contenido"
        mensaje="Esto reemplazará el título y las preguntas actuales del formulario. ¿Continuar?"
        confirmLabel="Reemplazar"
        peligroso={false}
        onConfirm={ejecutarGeneracion}
        onCancel={() => setConfirmandoReemplazo(false)}
      />
    </form>
  );
}
