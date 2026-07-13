"use client";

import { nivelBadgeClase } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function VocabularyLessonPlayer({
  leccion,
  esAdmin,
  progresoInicial,
}) {
  const [vista, setVista] = useState("aprender");
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [progreso, setProgreso] = useState(progresoInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const ejercicio = leccion.ejercicios[indicePregunta];

  async function terminarPractica() {
    if (Object.keys(respuestas).length !== leccion.ejercicios.length) {
      setError("Responde todas las preguntas antes de terminar.");
      return;
    }

    if (esAdmin) return;
    setGuardando(true);
    setError("");
    const supabase = createClient();
    const { data, error: rpcError } = await supabase
      .rpc("enviar_resultado_leccion_vocabulario", {
        p_leccion_id: leccion.id,
        p_respuestas: respuestas,
      })
      .single();
    setGuardando(false);

    if (rpcError || !data) {
      setError("No se pudo guardar el resultado.");
      return;
    }

    setResultado(data);
    setProgreso({
      puntuacion: data.puntuacion,
      total: data.total,
      intentos: data.intentos,
    });
  }

  function repetir() {
    setRespuestas({});
    setResultado(null);
    setIndicePregunta(0);
    setError("");
  }

  return (
    <>
      <Link
        className="mb-6 inline-flex text-sm font-medium text-accent hover:underline"
        href="/vocabulario"
      >
        ← Volver a vocabulario
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-accent-muted px-2.5 py-1 text-xs font-medium text-teal-700">
            {leccion.tema}
          </span>
          <span className={nivelBadgeClase(leccion.nivel)}>
            Nivel {leccion.nivel}
          </span>
          {progreso && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Último resultado: {progreso.puntuacion}/{progreso.total}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
          {leccion.titulo}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          {leccion.descripcion}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          {leccion.palabras.length} palabras · {leccion.ejercicios.length}{" "}
          ejercicios
        </p>
      </header>

      <div className="mt-8 flex gap-2 border-b border-slate-200">
        <button
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            vista === "aprender"
              ? "border-accent text-accent"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          type="button"
          onClick={() => setVista("aprender")}
        >
          1. Aprender
        </button>
        <button
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            vista === "practicar"
              ? "border-accent text-accent"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          type="button"
          onClick={() => setVista("practicar")}
        >
          2. Practicar
        </button>
      </div>

      {vista === "aprender" ? (
        <section className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {leccion.palabras.map((palabra, indice) => (
              <article
                key={`${palabra.termino}-${indice}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {palabra.termino}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {palabra.pronunciacion}
                    </p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                    {indice + 1}
                  </span>
                </div>
                <p className="mt-4 font-medium text-teal-700">
                  {palabra.significado}
                </p>
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ejemplo
                  </p>
                  <p className="mt-1 text-sm italic leading-6 text-slate-700">
                    “{palabra.ejemplo}”
                  </p>
                </div>
              </article>
            ))}
          </div>
          <button
            className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            type="button"
            onClick={() => {
              setVista("practicar");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Practicar estas palabras
          </button>
        </section>
      ) : (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {resultado ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-2xl font-bold text-accent">
                {resultado.puntuacion}/{resultado.total}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                Práctica completada
              </h2>
              <p className="mt-2 text-slate-500">
                Este ha sido tu intento número {resultado.intentos}.
              </p>
              <button
                className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
                type="button"
                onClick={repetir}
              >
                Repetir ejercicios
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Pregunta {indicePregunta + 1} de {leccion.ejercicios.length}
                  </span>
                  <span className="text-slate-500">
                    {Math.round(
                      ((indicePregunta + 1) / leccion.ejercicios.length) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{
                      width: `${((indicePregunta + 1) / leccion.ejercicios.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <fieldset>
                <legend className="text-lg font-semibold text-slate-900">
                  {ejercicio.pregunta}
                </legend>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {ejercicio.opciones.map((opcion) => (
                    <label
                      key={opcion}
                      className={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition ${
                        respuestas[indicePregunta] === opcion
                          ? "border-accent bg-accent-muted text-teal-900"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        className="mr-3"
                        type="radio"
                        name={`ejercicio-${indicePregunta}`}
                        checked={respuestas[indicePregunta] === opcion}
                        onChange={() =>
                          setRespuestas((actuales) => ({
                            ...actuales,
                            [indicePregunta]: opcion,
                          }))
                        }
                      />
                      {opcion}
                    </label>
                  ))}
                </div>
              </fieldset>

              {esAdmin && (
                <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Esta es una vista previa. Los resultados solo se guardan para
                  estudiantes.
                </p>
              )}
              {error && <p className="mt-5 text-sm text-red-700">{error}</p>}

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  type="button"
                  disabled={indicePregunta === 0}
                  onClick={() => setIndicePregunta((actual) => actual - 1)}
                >
                  Anterior
                </button>
                {indicePregunta < leccion.ejercicios.length - 1 ? (
                  <button
                    className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                    type="button"
                    disabled={!respuestas[indicePregunta]}
                    onClick={() => setIndicePregunta((actual) => actual + 1)}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                    type="button"
                    disabled={
                      guardando ||
                      esAdmin ||
                      Object.keys(respuestas).length !==
                        leccion.ejercicios.length
                    }
                    onClick={terminarPractica}
                  >
                    {guardando ? "Guardando…" : "Terminar práctica"}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
