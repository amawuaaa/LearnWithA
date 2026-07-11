"use client";

import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";

function barajar(elementos) {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function crearTablero(pares) {
  const tarjetas = pares.flatMap((par, indice) => [
    { id: `${indice}-termino`, parId: indice, texto: par.termino },
    { id: `${indice}-pareja`, parId: indice, texto: par.pareja },
  ]);
  return barajar(tarjetas);
}

export default function MemoryGame({ juego, estudianteId }) {
  const [abierto, setAbierto] = useState(false);
  const [tablero, setTablero] = useState(() => crearTablero(juego.pares));
  const [volteadas, setVolteadas] = useState([]);
  const [resueltas, setResueltas] = useState([]);
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const totalParejas = useMemo(() => juego.pares.length, [juego.pares]);

  const completado = resueltas.length === totalParejas;

  function reiniciar() {
    setTablero(crearTablero(juego.pares));
    setVolteadas([]);
    setResueltas([]);
    setIntentos(0);
    setBloqueado(false);
    setGuardado(false);
    setError("");
  }

  async function guardarResultado(intentosFinales) {
    setGuardando(true);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("memoria_resultados")
      .insert({
        estudiante_id: estudianteId,
        juego_id: juego.id,
        intentos: intentosFinales,
      });

    if (insertError) {
      setError("No se pudo guardar el resultado.");
      setGuardando(false);
      return;
    }

    setGuardado(true);
    setGuardando(false);
  }

  function voltear(tarjeta) {
    if (bloqueado) return;
    if (volteadas.some((v) => v.id === tarjeta.id)) return;
    if (resueltas.includes(tarjeta.parId)) return;

    const nuevasVolteadas = [...volteadas, tarjeta];
    setVolteadas(nuevasVolteadas);

    if (nuevasVolteadas.length < 2) return;

    setBloqueado(true);
    const [primera, segunda] = nuevasVolteadas;
    const acierto = primera.parId === segunda.parId;
    const siguientesIntentos = intentos + 1;
    setIntentos(siguientesIntentos);

    setTimeout(() => {
      if (acierto) {
        const siguientesResueltas = [...resueltas, primera.parId];
        setResueltas(siguientesResueltas);
        if (siguientesResueltas.length === totalParejas) {
          guardarResultado(siguientesIntentos);
        }
      }
      setVolteadas([]);
      setBloqueado(false);
    }, 700);
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
          <h2 className="text-lg font-semibold text-slate-900">
            {juego.titulo}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {totalParejas} {totalParejas === 1 ? "pareja" : "parejas"}
          </p>
        </div>
        <span className="text-sm font-medium text-accent">
          {abierto ? "Ocultar" : "Jugar"}
        </span>
      </button>

      {abierto && (
        <div className="border-t border-slate-200 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tablero.map((tarjeta) => {
              const volteada = volteadas.some((v) => v.id === tarjeta.id);
              const resuelta = resueltas.includes(tarjeta.parId);
              const visible = volteada || resuelta;

              return (
                <button
                  key={tarjeta.id}
                  type="button"
                  className={`flex h-20 items-center justify-center rounded-lg border p-2 text-center text-sm font-medium transition ${
                    resuelta
                      ? "border-green-300 bg-green-50 text-green-700"
                      : visible
                        ? "border-accent bg-indigo-50 text-slate-900"
                        : "border-slate-300 bg-slate-100 text-transparent hover:bg-slate-200"
                  }`}
                  onClick={() => voltear(tarjeta)}
                  disabled={resuelta || bloqueado}
                >
                  {visible ? tarjeta.texto : "?"}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-slate-500">Intentos: {intentos}</p>

          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

          {completado && (
            <div className="mt-4 rounded-lg bg-indigo-50 p-4">
              <p className="font-semibold text-indigo-900">
                ¡Completado en {intentos}{" "}
                {intentos === 1 ? "intento" : "intentos"}!
              </p>
              <p className="mt-1 text-sm text-indigo-700">
                {guardando
                  ? "Guardando resultado…"
                  : guardado
                    ? "Tu resultado se ha guardado correctamente."
                    : ""}
              </p>
              <button
                className="mt-3 text-sm font-medium text-accent hover:underline"
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
