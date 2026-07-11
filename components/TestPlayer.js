"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function TestPlayer({ test, estudianteId }) {
  const [abierto, setAbierto] = useState(false);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function finalizar(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(respuestas).length !== test.preguntas.length) {
      setError("Responde todas las preguntas antes de terminar.");
      return;
    }

    const aciertos = test.preguntas.reduce((total, pregunta, indice) => {
      const correcta =
        typeof pregunta.respuesta_correcta === "number"
          ? pregunta.opciones[pregunta.respuesta_correcta]
          : pregunta.respuesta_correcta;
      return total + (respuestas[indice] === correcta ? 1 : 0);
    }, 0);

    setGuardando(true);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("estudiantes_progreso")
      .insert({
        estudiante_id: estudianteId,
        test_id: test.id,
        puntuacion: aciertos,
      });

    if (insertError) {
      setError("No se pudo guardar la puntuación.");
      setGuardando(false);
      return;
    }

    setResultado(aciertos);
    setGuardando(false);
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{test.titulo}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {test.preguntas.length}{" "}
            {test.preguntas.length === 1 ? "pregunta" : "preguntas"}
          </p>
        </div>
        <span className="text-sm font-medium text-accent">
          {abierto ? "Ocultar" : "Empezar"}
        </span>
      </button>

      {abierto && (
        <form className="border-t border-slate-200 p-5" onSubmit={finalizar}>
          <div className="space-y-7">
            {test.preguntas.map((pregunta, indice) => (
              <fieldset key={indice} disabled={resultado !== null}>
                <legend className="mb-3 font-medium text-slate-800">
                  {indice + 1}. {pregunta.pregunta}
                </legend>
                <div className="space-y-2">
                  {pregunta.opciones.map((opcion) => (
                    <label
                      key={opcion}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name={`pregunta-${indice}`}
                        value={opcion}
                        checked={respuestas[indice] === opcion}
                        onChange={() =>
                          setRespuestas((actuales) => ({
                            ...actuales,
                            [indice]: opcion,
                          }))
                        }
                      />
                      {opcion}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {error && <p className="mt-5 text-sm text-red-700">{error}</p>}

          {resultado === null ? (
            <button
              className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              type="submit"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Terminar test"}
            </button>
          ) : (
            <div className="mt-6 rounded-lg bg-indigo-50 p-4">
              <p className="font-semibold text-indigo-900">
                Resultado: {resultado} de {test.preguntas.length}
              </p>
              <p className="mt-1 text-sm text-indigo-700">
                Tu puntuación se ha guardado correctamente.
              </p>
            </div>
          )}
        </form>
      )}
    </article>
  );
}
