"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

function barajar(elementos) {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function formatearTiempo(totalSegundos) {
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, "0")}`;
}

export default function MemoryGame({ juego, estudianteId, mejorResultado }) {
  const [abierto, setAbierto] = useState(false);
  const [tablero, setTablero] = useState(() => barajar(juego.cartas));
  const [volteadas, setVolteadas] = useState([]);
  const [resueltas, setResueltas] = useState([]);
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [inicio, setInicio] = useState(null);
  const [segundos, setSegundos] = useState(0);
  const [duracionFinal, setDuracionFinal] = useState(null);

  const totalParejas = useMemo(
    () => Math.floor(juego.cartas.length / 2),
    [juego.cartas],
  );

  const completado =
    tablero.length > 0 && resueltas.length === tablero.length;

  useEffect(() => {
    if (!abierto || !inicio || completado) return undefined;

    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [abierto, completado, inicio]);

  function reiniciar() {
    setTablero(barajar(juego.cartas));
    setVolteadas([]);
    setResueltas([]);
    setIntentos(0);
    setBloqueado(false);
    setGuardado(false);
    setError("");
    setInicio(null);
    setSegundos(0);
    setDuracionFinal(null);
  }

  async function guardarResultado(intentosFinales, duracionSegundos) {
    setGuardando(true);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("memoria_resultados")
      .insert({
        estudiante_id: estudianteId,
        juego_id: juego.id,
        intentos: intentosFinales,
        duracion_segundos: duracionSegundos,
      });

    if (insertError) {
      setError("No se pudo guardar el resultado.");
      setGuardando(false);
      return;
    }

    setGuardado(true);
    setGuardando(false);
  }

  async function voltear(tarjeta) {
    if (bloqueado) return;
    if (volteadas.some((v) => v.id === tarjeta.id)) return;
    if (resueltas.includes(tarjeta.id)) return;

    if (!inicio) setInicio(Date.now());
    const nuevasVolteadas = [...volteadas, tarjeta];
    setVolteadas(nuevasVolteadas);

    if (nuevasVolteadas.length < 2) return;

    setBloqueado(true);
    const [primera, segunda] = nuevasVolteadas;
    const siguientesIntentos = intentos + 1;
    setIntentos(siguientesIntentos);

    // La comprobación se hace en el servidor para que el navegador nunca
    // reciba la lista completa de parejas.
    const supabase = createClient();
    const { data: acierto } = await supabase.rpc("comprobar_pareja_memoria", {
      p_juego_id: juego.id,
      p_texto_a: primera.texto,
      p_texto_b: segunda.texto,
    });

    setTimeout(() => {
      if (acierto) {
        const siguientesResueltas = [...resueltas, primera.id, segunda.id];
        setResueltas(siguientesResueltas);
        if (siguientesResueltas.length === tablero.length) {
          const tiempoFinal = Math.max(
            1,
            Math.floor((Date.now() - (inicio ?? Date.now())) / 1000),
          );
          setSegundos(tiempoFinal);
          setDuracionFinal(tiempoFinal);
          guardarResultado(siguientesIntentos, tiempoFinal);
        }
      }
      setVolteadas([]);
      setBloqueado(false);
    }, 700);
  }

  const estrellas =
    intentos <= totalParejas
      ? 3
      : intentos <= Math.ceil(totalParejas * 1.5)
        ? 2
        : 1;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
        type="button"
        onClick={() => {
          if (abierto) reiniciar();
          setAbierto(!abierto);
        }}
        aria-expanded={abierto}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 text-xl">
            🎯
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {juego.titulo}
            </h2>
          <p className="mt-1 text-sm text-slate-500">
            {totalParejas} {totalParejas === 1 ? "pareja" : "parejas"}
            {totalParejas === 8 ? " · Tablero 4×4" : ""}
            {mejorResultado && (
              <>
                {" "}
                · Mejor: {mejorResultado.intentos} intentos
                {mejorResultado.duracion_segundos
                  ? ` en ${formatearTiempo(mejorResultado.duracion_segundos)}`
                  : ""}
              </>
            )}
          </p>
          </div>
        </div>
        <span className="rounded-lg bg-accent-muted px-3 py-2 text-sm font-semibold text-accent">
          {abierto ? "Ocultar" : "Jugar"}
        </span>
      </button>

      {abierto && (
        <div className="border-t border-slate-800 bg-slate-950 p-2.5 sm:p-5">
          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-teal-950 via-slate-900 to-cyan-950 p-2.5 shadow-2xl sm:p-4">
            <div className="mb-4 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/5 py-3 text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/60">
                  Parejas
                </p>
                <p className="mt-1 font-bold text-white">
                  {resueltas.length / 2}/{totalParejas}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/60">
                  Intentos
                </p>
                <p className="mt-1 font-bold text-white">{intentos}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/60">
                  Tiempo
                </p>
                <p className="mt-1 font-mono font-bold text-white">
                  {formatearTiempo(duracionFinal ?? segundos)}
                </p>
              </div>
            </div>

            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500"
                style={{
                  width: `${(resueltas.length / tablero.length) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
            {tablero.map((tarjeta) => {
              const volteada = volteadas.some((v) => v.id === tarjeta.id);
              const resuelta = resueltas.includes(tarjeta.id);
              const visible = volteada || resuelta;

              return (
                <button
                  key={tarjeta.id}
                  type="button"
                  className={`flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-xl border p-1.5 text-center font-medium shadow-lg transition-all duration-300 sm:p-2 ${
                    resuelta
                      ? "scale-95 border-emerald-300/70 bg-emerald-50 text-emerald-700 shadow-emerald-500/10"
                      : visible
                        ? "border-white bg-white text-slate-900 shadow-white/10"
                        : "border-white/15 bg-gradient-to-br from-teal-500 via-cyan-600 to-emerald-600 text-white hover:-translate-y-1 hover:border-white/40 hover:shadow-teal-500/30"
                  }`}
                  onClick={() => voltear(tarjeta)}
                  disabled={resuelta || bloqueado}
                >
                  {visible ? (
                    <span className="flex flex-col items-center justify-center gap-1">
                      {tarjeta.emoji && (
                        <span className="text-2xl sm:text-4xl" aria-hidden="true">
                          {tarjeta.emoji}
                        </span>
                      )}
                      <span
                        className={
                          tarjeta.emoji
                            ? "break-words text-[9px] leading-tight sm:text-xs"
                            : "break-words text-[10px] leading-tight sm:text-sm"
                        }
                      >
                        {tarjeta.texto}
                      </span>
                    </span>
                  ) : (
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-bold text-white/90 sm:h-10 sm:w-10 sm:text-2xl"
                      aria-label="Tarjeta oculta"
                    >
                      ✦
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-950/70 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {completado && (
            <div className="mx-auto mt-4 max-w-xl rounded-xl border border-amber-300/20 bg-gradient-to-r from-amber-400/10 to-yellow-300/10 p-5 text-center">
              <p className="font-semibold text-white">
                ¡Completado en {intentos}{" "}
                {intentos === 1 ? "intento" : "intentos"}!
              </p>
              <p className="mt-2 text-2xl" aria-label={`${estrellas} estrellas`}>
                {"⭐".repeat(estrellas)}
              </p>
              <p className="mt-1 text-sm text-teal-200">
                Tiempo: {formatearTiempo(duracionFinal ?? segundos)}
              </p>
              <p className="mt-1 text-sm text-teal-200">
                {guardando
                  ? "Guardando resultado…"
                  : guardado
                    ? "Tu resultado se ha guardado correctamente."
                    : ""}
              </p>
              <button
                className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-accent-muted"
                type="button"
                onClick={reiniciar}
              >
                Volver a jugar
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
