"use client";

import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import AdminGenerarClasesForm from "./AdminGenerarClasesForm";
import {
  NOMBRES_DIAS_CORTOS,
  clasesPorFecha,
  fechasConClase,
  formatearFechaLocal,
  formatearHora,
  generarGrillaMes,
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
  clasesIniciales,
  eventosIniciales,
  estudiantes,
  usuarioId,
}) {
  const [clases, setClases] = useState(clasesIniciales);
  const [eventos, setEventos] = useState(eventosIniciales);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [estudianteNuevo, setEstudianteNuevo] = useState(
    estudiantes[0]?.id ?? "",
  );
  const [horaNueva, setHoraNueva] = useState("18:00");
  const [tipoEvento, setTipoEvento] = useState("anuncio");
  const [tituloEvento, setTituloEvento] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [guardandoClase, setGuardandoClase] = useState(false);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [error, setError] = useState("");

  const hoy = useMemo(() => new Date(), []);
  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );

  const clasesVisibles = useMemo(() => {
    if (esAdmin) return clases;
    return clases.filter((clase) => clase.estudiante_id === usuarioId);
  }, [clases, esAdmin, usuarioId]);

  const fechasClaseSet = useMemo(
    () => fechasConClase(clasesVisibles),
    [clasesVisibles],
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
  const diaSeleccionadoStr = diaSeleccionado
    ? formatearFechaLocal(diaSeleccionado)
    : null;
  const clasesDiaSeleccionado = diaSeleccionadoStr
    ? clasesPorFecha(clasesVisibles, diaSeleccionadoStr)
    : [];
  const eventosDiaSeleccionado = diaSeleccionadoStr
    ? (eventosPorFecha[diaSeleccionadoStr] ?? [])
    : [];

  function cambiarMes(delta) {
    setMesVisible(
      (actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1),
    );
  }

  function irAHoy() {
    setMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  }

  function abrirDia(fecha) {
    setError("");
    setDiaSeleccionado(fecha);
    setEstudianteNuevo(estudiantes[0]?.id ?? "");
    setHoraNueva("18:00");
  }

  async function anadirClase(event) {
    event.preventDefault();
    if (!diaSeleccionadoStr || !estudianteNuevo || !horaNueva) return;

    setGuardandoClase(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("clases_estudiante")
      .insert({
        estudiante_id: estudianteNuevo,
        fecha: diaSeleccionadoStr,
        hora: horaNueva,
      })
      .select(
        "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)",
      )
      .single();
    setGuardandoClase(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ese alumno ya tiene clase a esa hora ese día."
          : "No se pudo programar la clase.",
      );
      return;
    }

    setClases((actuales) =>
      [...actuales, data].sort(
        (a, b) =>
          a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
      ),
    );
  }

  async function cancelarClase(clase, restaurar = false) {
    setError("");
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("clases_estudiante")
      .update({
        cancelada: !restaurar,
        motivo_cancelacion: restaurar ? null : clase.motivo_cancelacion ?? null,
      })
      .eq("id", clase.id)
      .select(
        "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)",
      )
      .single();

    if (updateError || !data) {
      setError(
        restaurar
          ? "No se pudo restaurar la clase."
          : "No se pudo cancelar la clase.",
      );
      return;
    }

    setClases((actuales) =>
      actuales.map((actual) => (actual.id === data.id ? data : actual)),
    );
  }

  async function eliminarClase(id) {
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("clases_estudiante")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar la clase.");
      return;
    }

    setClases((actuales) => actuales.filter((clase) => clase.id !== id));
  }

  async function crearEvento(event) {
    event.preventDefault();
    if (!diaSeleccionadoStr || !tituloEvento.trim()) return;

    setGuardandoEvento(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("eventos_calendario")
      .insert({
        fecha: diaSeleccionadoStr,
        tipo: tipoEvento,
        titulo: tituloEvento.trim(),
        descripcion: descripcionEvento.trim() || null,
        creado_por: usuarioId,
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

  function etiquetaClaseCelda(clasesDia) {
    const activas = clasesDia.filter((clase) => !clase.cancelada);
    if (activas.length === 0) {
      const canceladas = clasesDia.length;
      return canceladas > 0 ? `${canceladas} cancel.` : null;
    }

    if (esAdmin) {
      return activas.length === 1
        ? `${formatearHora(activas[0].hora)} · 1`
        : `${activas.length} clases`;
    }

    return activas
      .slice(0, 2)
      .map((clase) => formatearHora(clase.hora))
      .join(", ");
  }

  return (
    <>
      <PageHeader
        etiqueta="Horario"
        titulo="Calendario"
        descripcion={
          esAdmin
            ? "Programa clases por día, hora y alumno. Añade exámenes o avisos cuando lo necesites."
            : "Consulta tus clases, exámenes y avisos del mes."
        }
      />

      {esAdmin && (
        <AdminGenerarClasesForm
          estudiantes={estudiantes}
          onGeneradas={setClases}
        />
      )}

      {error && (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {error}
        </p>
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
            <h2 className="min-w-0 text-center font-semibold text-slate-900">
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
          <Button variante="secondary" type="button" onClick={irAHoy}>
            Hoy
          </Button>
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
            const clasesDia = clasesPorFecha(clasesVisibles, fechaStr);
            const clasesActivas = clasesDia.filter((clase) => !clase.cancelada);
            const eventosDia = eventosPorFecha[fechaStr] ?? [];
            const tieneClase = fechasClaseSet.has(fechaStr);
            const esHoy = fechaStr === hoyStr;
            const etiqueta = etiquetaClaseCelda(clasesDia);

            let clasesCelda =
              "flex min-h-16 flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-sm transition";

            if (!enMes) {
              clasesCelda += " text-slate-300";
            } else if (
              clasesActivas.length === 0 &&
              clasesDia.some((clase) => clase.cancelada)
            ) {
              clasesCelda += " bg-red-50 text-red-700";
            } else if (tieneClase && clasesActivas.length > 0) {
              clasesCelda += " bg-accent-muted font-semibold text-accent";
            } else if (eventosDia.length > 0) {
              clasesCelda += " bg-slate-50 text-slate-700";
            } else {
              clasesCelda += " text-slate-600 hover:bg-slate-50";
            }

            if (esHoy) {
              clasesCelda += " ring-2 ring-accent ring-offset-1";
            }

            if (enMes) {
              clasesCelda += " cursor-pointer hover:shadow-sm";
            }

            const contenido = (
              <>
                <span className="font-semibold">{fecha.getDate()}</span>
                {enMes && etiqueta && (
                  <span className="line-clamp-2 w-full px-0.5 text-[9px] font-medium leading-tight">
                    {etiqueta}
                  </span>
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
                  className={clasesCelda}
                  onClick={() => abrirDia(fecha)}
                >
                  {contenido}
                </button>
              );
            }

            return (
              <div key={fechaStr} className={clasesCelda}>
                {contenido}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-accent-muted" /> Día con clase
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" />{" "}
            Solo cancelaciones
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
              {clasesDiaSeleccionado.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {esAdmin
                    ? "Todavía no hay clases este día. Añade una abajo."
                    : "No tienes clase programada este día."}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {clasesDiaSeleccionado.map((clase) => (
                    <li
                      key={clase.id}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        clase.cancelada
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-accent/20 bg-accent-muted text-teal-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {formatearHora(clase.hora)}
                            {esAdmin &&
                              ` · ${clase.estudiante?.nombre ?? "Alumno"}`}
                          </p>
                          {clase.cancelada && (
                            <p className="mt-0.5 text-xs">Cancelada</p>
                          )}
                        </div>
                        {esAdmin && (
                          <div className="flex shrink-0 gap-2">
                            {clase.cancelada ? (
                              <Button
                                variante="enlace"
                                type="button"
                                onClick={() => cancelarClase(clase, true)}
                              >
                                Restaurar
                              </Button>
                            ) : (
                              <Button
                                variante="enlacePeligro"
                                type="button"
                                onClick={() => cancelarClase(clase)}
                              >
                                Cancelar
                              </Button>
                            )}
                            <Button
                              variante="enlacePeligro"
                              type="button"
                              onClick={() => eliminarClase(clase.id)}
                            >
                              Quitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {esAdmin && (
              <form
                className="border-t border-slate-100 pt-4"
                onSubmit={anadirClase}
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  Añadir clase
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Alumno
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                      value={estudianteNuevo}
                      onChange={(event) =>
                        setEstudianteNuevo(event.target.value)
                      }
                      required
                    >
                      {estudiantes.length === 0 && (
                        <option value="">Sin alumnos</option>
                      )}
                      {estudiantes.map((estudiante) => (
                        <option key={estudiante.id} value={estudiante.id}>
                          {estudiante.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Hora
                    <input
                      type="time"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                      value={horaNueva}
                      onChange={(event) => setHoraNueva(event.target.value)}
                      required
                    />
                  </label>
                </div>
                <Button
                  className="mt-4"
                  type="submit"
                  disabled={guardandoClase || estudiantes.length === 0}
                >
                  {guardandoClase ? "Guardando…" : "Programar clase"}
                </Button>
              </form>
            )}

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
                          <Button
                            variante="enlacePeligro"
                            type="button"
                            onClick={() => eliminarEvento(evento.id)}
                          >
                            Eliminar
                          </Button>
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
                <Button
                  className="mt-4"
                  type="submit"
                  disabled={guardandoEvento}
                >
                  {guardandoEvento ? "Guardando…" : "Añadir al calendario"}
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
