"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function TestPlayer({ test }) {
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

    setGuardando(true);
    const supabase = createClient();
    // La calificación se hace en el servidor (RPC) para que las respuestas
    // correctas nunca lleguen al navegador del alumno.
    const { data, error: rpcError } = await supabase
      .rpc("enviar_resultado_test", {
        p_test_id: test.id,
        p_respuestas: respuestas,
      })
      .single();

    if (rpcError || !data) {
      setError("No se pudo guardar la puntuación.");
      setGuardando(false);
      return;
    }

    setResultado(data);
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
              className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              type="submit"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Terminar test"}
            </button>
          ) : (
            <div className="mt-6 rounded-lg bg-accent-muted p-4">
              <p className="font-semibold text-teal-900">
                Resultado: {resultado.puntuacion} de {resultado.total}
              </p>
              <p className="mt-1 text-sm text-teal-700">
                Intento {resultado.intentos}. Se conserva tu mejor puntuación.
              </p>
              <button
                className="mt-3 text-sm font-semibold text-accent hover:underline"
                type="button"
                onClick={() => {
                  setRespuestas({});
                  setResultado(null);
                  setError("");
                }}
              >
                Repetir test
              </button>
            </div>
          )}
        </form>
      )}
    </article>
  );
}
