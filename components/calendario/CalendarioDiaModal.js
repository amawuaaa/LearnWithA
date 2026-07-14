"use client";

import Button from "@/components/ui/Button";
import { formatearHora } from "@/lib/horario";
import Modal from "../Modal";

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

export default function CalendarioDiaModal({ cal }) {
  return (
    <Modal
      abierto={cal.diaSeleccionado !== null}
      titulo={
        cal.diaSeleccionadoStr
          ? fechaLarga(cal.diaSeleccionadoStr)
          : "Detalle del día"
      }
      onClose={() => cal.setDiaSeleccionado(null)}
    >
      {cal.diaSeleccionadoStr && (
        <div className="space-y-5">
          <section>
            <h3 className="text-sm font-semibold text-slate-900">Clases</h3>
            {cal.clasesDiaSeleccionado.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                {cal.esAdmin
                  ? "Todavía no hay clases este día. Añade una abajo."
                  : "No tienes clase programada este día."}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {cal.clasesDiaSeleccionado.map((clase) => (
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
                          {cal.esAdmin &&
                            ` · ${clase.estudiante?.nombre ?? "Alumno"}`}
                        </p>
                        {clase.cancelada && (
                          <p className="mt-0.5 text-xs">Cancelada</p>
                        )}
                      </div>
                      {cal.esAdmin && (
                        <div className="flex shrink-0 gap-2">
                          {clase.cancelada ? (
                            <Button
                              variante="enlace"
                              type="button"
                              onClick={() => cal.cancelarClase(clase, true)}
                            >
                              Restaurar
                            </Button>
                          ) : (
                            <Button
                              variante="enlacePeligro"
                              type="button"
                              onClick={() => cal.cancelarClase(clase)}
                            >
                              Cancelar
                            </Button>
                          )}
                          <Button
                            variante="enlacePeligro"
                            type="button"
                            onClick={() => cal.eliminarClase(clase.id)}
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

          {cal.esAdmin && (
            <form
              className="border-t border-slate-100 pt-4"
              onSubmit={cal.anadirClase}
            >
              <h3 className="text-sm font-semibold text-slate-900">
                Añadir clase
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Alumno
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                    value={cal.estudianteNuevo}
                    onChange={(event) =>
                      cal.setEstudianteNuevo(event.target.value)
                    }
                    required
                  >
                    {cal.estudiantes.length === 0 && (
                      <option value="">Sin alumnos</option>
                    )}
                    {cal.estudiantes.map((estudiante) => (
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
                    value={cal.horaNueva}
                    onChange={(event) => cal.setHoraNueva(event.target.value)}
                    required
                  />
                </label>
              </div>
              <Button
                className="mt-4"
                type="submit"
                disabled={cal.guardandoClase || cal.estudiantes.length === 0}
              >
                {cal.guardandoClase ? "Guardando…" : "Programar clase"}
              </Button>
            </form>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-900">
              Eventos del día
            </h3>
            {cal.eventosDiaSeleccionado.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Sin exámenes ni avisos.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {cal.eventosDiaSeleccionado.map((evento) => (
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
                      {cal.esAdmin && (
                        <Button
                          variante="enlacePeligro"
                          type="button"
                          onClick={() => cal.eliminarEvento(evento.id)}
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

          {cal.esAdmin && (
            <form
              className="border-t border-slate-100 pt-4"
              onSubmit={cal.crearEvento}
            >
              <h3 className="text-sm font-semibold text-slate-900">
                Añadir evento
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Tipo
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                    value={cal.tipoEvento}
                    onChange={(event) => cal.setTipoEvento(event.target.value)}
                  >
                    <option value="anuncio">Aviso</option>
                    <option value="examen">Examen</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  Título
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                    value={cal.tituloEvento}
                    onChange={(event) => cal.setTituloEvento(event.target.value)}
                    placeholder="Ej: Examen de unidad 3"
                    maxLength={120}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  Descripción (opcional)
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
                    value={cal.descripcionEvento}
                    onChange={(event) =>
                      cal.setDescripcionEvento(event.target.value)
                    }
                    placeholder="Detalles para los alumnos…"
                    maxLength={500}
                  />
                </label>
              </div>
              <Button className="mt-4" type="submit" disabled={cal.guardandoEvento}>
                {cal.guardandoEvento ? "Guardando…" : "Añadir al calendario"}
              </Button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
