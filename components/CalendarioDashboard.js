"use client";

import {
  NOMBRES_DIAS,
  NOMBRES_DIAS_CORTOS,
  diasConClase,
  formatearFechaLocal,
  formatearHora,
  generarGrillaMes,
  slotsPorDia,
} from "@/lib/horario";
import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";
import Modal from "./Modal";

const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ESTILOS_EVENTO = {
  examen: "bg-amber-100 text-amber-800 border-amber-200",
  anuncio: "bg-sky-100 text-sky-800 border-sky-200",
};

function fechaLarga(fechaStr) {
  return new Date(`${fechaStr}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function CalendarioDashboard({
  esAdmin,
  horarioInicial,
  canceladasIniciales,
  eventosIniciales,
}) {
  const [horario, setHorario] = useState(horarioInicial);
  const [canceladas, setCanceladas] = useState(canceladasIniciales);
  const [eventos, setEventos] = useState(eventosIniciales);
  const [guardandoSlot, setGuardandoSlot] = useState(null);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [guardandoCancelacion, setGuardandoCancelacion] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [tipoEvento, setTipoEvento] = useState("anuncio");
  const [tituloEvento, setTituloEvento] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [error, setError] = useState("");

  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );

  const diasSemanaSet = useMemo(() => diasConClase(horario), [horario]);
  const canceladaPorFecha = useMemo(
    () => Object.fromEntries(canceladas.map((c) => [c.fecha, c])),
    [canceladas],
  );
  const eventosPorFecha = useMemo(() => {
    const mapa = {};
    for (const evento of eventos) {
      mapa[evento.fecha] = [...(mapa[evento.fecha] ?? []), evento];
    }
    return mapa;
  }, [eventos]);
  const grilla = useMemo(
    () => generarGrillaMes(mesVisible.getFullYear(), mesVisible.getMonth()),
    [mesVisible],
  );
  const hoyStr = formatearFechaLocal(hoy);

  const proximasCancelaciones = canceladas
    .filter((c) => c.fecha >= hoyStr)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const diaSeleccionadoStr = diaSeleccionado
    ? formatearFechaLocal(diaSeleccionado)
    : null;
  const eventosDiaSeleccionado = diaSeleccionadoStr
    ? (eventosPorFecha[diaSeleccionadoStr] ?? [])
    : [];
  const slotsDiaSeleccionado = diaSeleccionado
    ? slotsPorDia(horario, diaSeleccionado.getDay())
    : [];

  function cambiarMes(delta) {
    setMesVisible(
      (actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1),
    );
  }

  function irAHoy() {
    setMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  }

  async function anadirSlot(diaSemana) {
    setError("");
    setGuardandoSlot(`${diaSemana}-nuevo`);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("horario_clases")
      .insert({ dia_semana: diaSemana, hora: "18:00" })
      .select()
      .single();
    setGuardandoSlot(null);

    if (insertError || !data) {
      setError(
        insertError?.code === "23505"
          ? "Ya existe una clase a esa hora en ese día."
          : "No se pudo añadir la hora.",
      );
      return;
    }
    setHorario((actuales) => [...actuales, data]);
  }

  async function eliminarSlot(id) {
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("horario_clases")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar la hora.");
      return;
    }
    setHorario((actuales) => actuales.filter((slot) => slot.id !== id));
  }

  async function actualizarHoraSlot(id, hora) {
    if (!hora) return;

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("horario_clases")
      .update({ hora })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !data) {
      setError(
        updateError?.code === "23505"
          ? "Ya hay otra clase a esa hora."
          : "No se pudo actualizar la hora.",
      );
      return;
    }
    setHorario((actuales) =>
      actuales.map((slot) => (slot.id === data.id ? data : slot)),
    );
  }

  function abrirDia(fecha) {
    setError("");
    setTipoEvento("anuncio");
    setTituloEvento("");
    setDescripcionEvento("");
    setDiaSeleccionado(fecha);
  }

  function abrirCancelar(fecha) {
    setError("");
    setMotivo("");
    setModalCancelar(fecha);
    setDiaSeleccionado(null);
  }

  async function confirmarCancelar() {
    setGuardandoCancelacion(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("clases_canceladas")
      .insert({
        fecha: formatearFechaLocal(modalCancelar),
        motivo: motivo.trim() || null,
      })
      .select()
      .single();
    setGuardandoCancelacion(false);

    if (insertError || !data) {
      setError("No se pudo cancelar la clase.");
      return;
    }
    setCanceladas((actuales) => [...actuales, data]);
    setModalCancelar(null);
  }

  async function restaurarClase(fechaStr) {
    const existente = canceladaPorFecha[fechaStr];
    if (!existente) return;

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("clases_canceladas")
      .delete()
      .eq("id", existente.id);

    if (deleteError) {
      setError("No se pudo restaurar la clase.");
      return;
    }
    setCanceladas((actuales) => actuales.filter((c) => c.id !== existente.id));
  }

  async function crearEvento(event) {
    event.preventDefault();
    if (!diaSeleccionadoStr) return;

    const titulo = tituloEvento.trim();
    if (!titulo) {
      setError("Escribe un título para el evento.");
      return;
    }

    setGuardandoEvento(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error: insertError } = await supabase
      .from("eventos_calendario")
      .insert({
        fecha: diaSeleccionadoStr,
        tipo: tipoEvento,
        titulo,
        descripcion: descripcionEvento.trim() || null,
        creado_por: user.id,
      })
      .select()
      .single();
    setGuardandoEvento(false);

    if (insertError || !data) {
      setError("No se pudo crear el evento.");
      return;
    }
    setEventos((actuales) => [...actuales, data]);
    setTituloEvento("");
    setDescripcionEvento("");
  }

  async function eliminarEvento(id) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("eventos_calendario")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar el evento.");
      return;
    }
    setEventos((actuales) => actuales.filter((evento) => evento.id !== id));
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Horario</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Calendario
        </h1>
        <p className="mt-2 text-slate-500">
          {esAdmin
            ? "Configura varias horas por día, marca cancelaciones y añade exámenes o avisos."
            : "Consulta tus clases, exámenes y avisos del mes."}
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {esAdmin && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-slate-900">
            Horario semanal
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Añade tantas horas como necesites en cada día de la semana.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {NOMBRES_DIAS.map((nombre, dia) => {
              const slots = slotsPorDia(horario, dia);

              return (
                <div
                  key={dia}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {nombre}
                    </span>
                    <button
                      type="button"
                      disabled={guardandoSlot === `${dia}-nuevo`}
                      onClick={() => anadirSlot(dia)}
                      className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                    >
                      + Hora
                    </button>
                  </div>
                  {slots.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin clase</p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-muted/50 px-2 py-1.5"
                        >
                          <input
                            type="time"
                            className="flex-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs outline-none focus:border-accent"
                            value={formatearHora(slot.hora)}
                            onChange={(event) =>
                              actualizarHoraSlot(slot.id, event.target.value)
                            }
                            aria-label={`Hora de clase los ${nombre}`}
                          />
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:underline"
                            onClick={() => eliminarSlot(slot.id)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              onClick={() => cambiarMes(-1)}
            >
              ‹
            </button>
            <h2 className="min-w-40 text-center font-semibold text-slate-900">
              {NOMBRES_MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </h2>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              onClick={() => cambiarMes(1)}
            >
              ›
            </button>
          </div>
          <button
            type="button"
            className="rounded-lg border border-accent/30 bg-accent-muted px-3 py-1.5 text-sm font-medium text-accent hover:bg-teal-100"
            onClick={irAHoy}
          >
            Hoy
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
          {NOMBRES_DIAS_CORTOS.map((dia, indice) => (
            <div key={indice} className="py-1">
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grilla.map(({ fecha, enMes }) => {
            const fechaStr = formatearFechaLocal(fecha);
            const esDiaDeClase = diasSemanaSet.has(fecha.getDay());
            const cancelacion = canceladaPorFecha[fechaStr];
            const eventosDia = eventosPorFecha[fechaStr] ?? [];
            const slotsDia = slotsPorDia(horario, fecha.getDay());
            const esHoy = fechaStr === hoyStr;

            let clases =
              "flex min-h-16 flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-sm transition";

            if (!enMes) {
              clases += " text-slate-300";
            } else if (cancelacion) {
              clases += " bg-red-50 text-red-700";
            } else if (esDiaDeClase) {
              clases += " bg-accent-muted font-semibold text-accent";
            } else if (eventosDia.length > 0) {
              clases += " bg-slate-50 text-slate-700";
            } else {
              clases += " text-slate-600 hover:bg-slate-50";
            }

            if (esHoy) {
              clases += " ring-2 ring-accent ring-offset-1";
            }

            if (enMes) {
              clases += " cursor-pointer hover:shadow-sm";
            }

            const contenido = (
              <>
                <span className="font-semibold">{fecha.getDate()}</span>
                {enMes && cancelacion && (
                  <span className="text-[10px] font-medium text-red-600">
                    Cancelada
                  </span>
                )}
                {enMes && !cancelacion && esDiaDeClase && slotsDia.length > 0 && (
                  <div className="flex w-full flex-col gap-0.5">
                    {slotsDia.slice(0, 2).map((slot) => (
                      <span
                        key={slot.id}
                        className="rounded bg-white/70 px-1 text-[9px] font-medium text-teal-800"
                      >
                        {formatearHora(slot.hora)}
                      </span>
                    ))}
                    {slotsDia.length > 2 && (
                      <span className="text-[9px] text-teal-700">
                        +{slotsDia.length - 2}
                      </span>
                    )}
                  </div>
                )}
                {enMes && eventosDia.length > 0 && (
                  <div className="mt-auto flex flex-wrap justify-center gap-0.5">
                    {eventosDia.slice(0, 3).map((evento) => (
                      <span
                        key={evento.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          evento.tipo === "examen"
                            ? "bg-amber-500"
                            : "bg-sky-500"
                        }`}
                        title={evento.titulo}
                      />
                    ))}
                  </div>
                )}
              </>
            );

            if (enMes) {
              return (
                <button
                  key={fechaStr}
                  type="button"
                  title={cancelacion?.motivo ?? undefined}
                  className={clases}
                  onClick={() => abrirDia(fecha)}
                >
                  {contenido}
                </button>
              );
            }

            return (
              <div key={fechaStr} className={clases}>
                {contenido}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-accent-muted" /> Día de clase
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" />{" "}
            Cancelada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500" /> Examen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sky-500" /> Aviso
          </span>
          <span className="text-slate-400">Pulsa un día para ver el detalle</span>
        </div>
      </section>

      {esAdmin && proximasCancelaciones.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Próximas cancelaciones
          </h2>
          <div className="space-y-3">
            {proximasCancelaciones.map((cancelacion) => (
              <div
                key={cancelacion.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium capitalize text-slate-900">
                    {fechaLarga(cancelacion.fecha)}
                  </p>
                  {cancelacion.motivo && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {cancelacion.motivo}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm font-medium text-accent hover:underline"
                  onClick={() => restaurarClase(cancelacion.fecha)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal
        abierto={diaSeleccionado !== null}
        titulo={
          diaSeleccionadoStr
            ? fechaLarga(diaSeleccionadoStr)
            : "Detalle del día"
        }
        onClose={() => setDiaSeleccionado(null)}
      >
        {diaSeleccionadoStr && (
          <div className="space-y-5">
            <section>
              <h3 className="text-sm font-semibold text-slate-900">Clases</h3>
              {canceladaPorFecha[diaSeleccionadoStr] ? (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium">Clase cancelada</p>
                  {canceladaPorFecha[diaSeleccionadoStr].motivo && (
                    <p className="mt-1">
                      {canceladaPorFecha[diaSeleccionadoStr].motivo}
                    </p>
                  )}
                  {esAdmin && (
                    <button
                      type="button"
                      className="mt-2 text-sm font-medium text-accent hover:underline"
                      onClick={() => {
                        restaurarClase(diaSeleccionadoStr);
                        setDiaSeleccionado(null);
                      }}
                    >
                      Restaurar clase
                    </button>
                  )}
                </div>
              ) : slotsDiaSeleccionado.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {slotsDiaSeleccionado.map((slot) => (
                    <li
                      key={slot.id}
                      className="rounded-lg bg-accent-muted px-3 py-2 text-sm font-medium text-teal-800"
                    >
                      {formatearHora(slot.hora)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No hay clase programada este día.
                </p>
              )}
              {esAdmin &&
                slotsDiaSeleccionado.length > 0 &&
                !canceladaPorFecha[diaSeleccionadoStr] && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-medium text-red-600 hover:underline"
                    onClick={() => abrirCancelar(diaSeleccionado)}
                  >
                    Cancelar clase de este día
                  </button>
                )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900">
                Eventos del día
              </h3>
              {eventosDiaSeleccionado.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Sin exámenes ni avisos.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {eventosDiaSeleccionado.map((evento) => (
                    <div
                      key={evento.id}
                      className={`rounded-lg border px-3 py-2 ${ESTILOS_EVENTO[evento.tipo]}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                            {evento.tipo === "examen" ? "Examen" : "Aviso"}
                          </p>
                          <p className="mt-0.5 font-medium">{evento.titulo}</p>
                          {evento.descripcion && (
                            <p className="mt-1 text-sm opacity-90">
                              {evento.descripcion}
                            </p>
                          )}
                        </div>
                        {esAdmin && (
                          <button
                            type="button"
                            className="shrink-0 text-xs font-medium text-red-700 hover:underline"
                            onClick={() => eliminarEvento(evento.id)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {esAdmin && (
              <form className="border-t border-slate-100 pt-4" onSubmit={crearEvento}>
                <h3 className="text-sm font-semibold text-slate-900">
                  Añadir evento
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Tipo
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                      value={tipoEvento}
                      onChange={(event) => setTipoEvento(event.target.value)}
                    >
                      <option value="anuncio">Aviso</option>
                      <option value="examen">Examen</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    Título
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                      value={tituloEvento}
                      onChange={(event) => setTituloEvento(event.target.value)}
                      placeholder="Ej: Examen de unidad 3"
                      maxLength={120}
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    Descripción (opcional)
                    <textarea
                      className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                      value={descripcionEvento}
                      onChange={(event) =>
                        setDescripcionEvento(event.target.value)
                      }
                      placeholder="Detalles para los alumnos…"
                      maxLength={500}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={guardandoEvento}
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                >
                  {guardandoEvento ? "Guardando…" : "Añadir al calendario"}
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>

      <Modal
        abierto={modalCancelar !== null}
        titulo="Cancelar clase"
        onClose={() => setModalCancelar(null)}
      >
        {modalCancelar && (
          <div>
            <p className="text-sm text-slate-600">
              ¿Cancelar la clase del{" "}
              <span className="font-medium capitalize">
                {fechaLarga(formatearFechaLocal(modalCancelar))}
              </span>
              ?
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Motivo (opcional)
              <textarea
                className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Ej: festivo, viaje, imprevisto…"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
                disabled={guardandoCancelacion}
                onClick={() => setModalCancelar(null)}
              >
                Cerrar
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                type="button"
                disabled={guardandoCancelacion}
                onClick={confirmarCancelar}
              >
                {guardandoCancelacion ? "Un momento…" : "Cancelar clase"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
