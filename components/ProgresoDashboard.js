"use client";

import PageHeader from "@/components/ui/PageHeader";
import { NIVELES, nivelBadgeClase } from "@/lib/niveles";
import {
  contarActividad,
  fechaUltimaActividad,
  filtrarYOrdenarAlumnos,
} from "@/lib/progreso";
import { useMemo, useState } from "react";

function fechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ResumenAlumno({ tests, lecciones, partidasMemoria }) {
  const items = [
    { etiqueta: "Tests", valor: tests },
    { etiqueta: "Lecciones", valor: lecciones },
    { etiqueta: "Memoria", valor: partidasMemoria },
  ];

  return (
    <dl className="mt-3 flex flex-wrap gap-2">
      {items.map(({ etiqueta, valor }) => (
        <div
          key={etiqueta}
          className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-center ring-1 ring-slate-200/80"
        >
          <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {etiqueta}
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-slate-900">
            {valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Seccion({ titulo, vacio, children }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </h3>
      {vacio ? (
        <p className="mt-2 text-sm text-slate-400">Sin actividad todavía.</p>
      ) : (
        <ul className="mt-2 space-y-2">{children}</ul>
      )}
    </section>
  );
}

function Metrica({ etiqueta, valor }) {
  return (
    <div className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200/80">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p className="text-xs font-semibold text-slate-800">{valor}</p>
    </div>
  );
}

function FilaActividad({ titulo, metricas }) {
  return (
    <li className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:border-0 sm:bg-transparent sm:p-0">
      <p className="text-sm font-medium leading-snug text-slate-900 sm:truncate">
        {titulo}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-1.5 sm:flex sm:flex-wrap">
        {metricas.map(({ etiqueta, valor }) => (
          <Metrica key={etiqueta} etiqueta={etiqueta} valor={valor} />
        ))}
      </div>
    </li>
  );
}

function metricasTest(test) {
  return [
    {
      etiqueta: "Nota",
      valor: test.total
        ? `${test.puntuacion}/${test.total}`
        : String(test.puntuacion),
    },
    { etiqueta: "Intentos", valor: String(test.intentos) },
    { etiqueta: "Fecha", valor: fechaCorta(test.completado_en) },
  ];
}

function metricasLeccion(leccion) {
  return [
    { etiqueta: "Nota", valor: `${leccion.puntuacion}/${leccion.total}` },
    { etiqueta: "Intentos", valor: String(leccion.intentos) },
    { etiqueta: "Fecha", valor: fechaCorta(leccion.completado_en) },
  ];
}

function metricasMemoria(juego) {
  return [
    { etiqueta: "Mejor", valor: `${juego.mejorIntentos} intentos` },
    { etiqueta: "Partidas", valor: String(juego.partidas) },
    { etiqueta: "Última", valor: fechaCorta(juego.ultimaFecha) },
  ];
}

function TarjetaAlumno({ alumno, expandido, onToggle }) {
  const contadores = contarActividad(alumno);
  const ultima = fechaUltimaActividad(alumno);
  const sinActividad = contadores.total === 0;

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expandido}
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 text-base font-semibold text-slate-900 sm:text-lg">
              {alumno.nombre}
            </h2>
            <span className={nivelBadgeClase(alumno.nivel)}>
              Nivel {alumno.nivel ?? "A1"}
            </span>
            {sinActividad && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/80">
                Sin actividad
              </span>
            )}
          </div>

          {sinActividad ? (
            <p className="mt-2 text-sm text-slate-400">
              Todavía no ha completado tests, lecciones ni memoria.
            </p>
          ) : (
            <>
              <ResumenAlumno
                tests={contadores.tests}
                lecciones={contadores.lecciones}
                partidasMemoria={contadores.partidasMemoria}
              />
              {ultima && (
                <p className="mt-2 text-xs text-slate-500">
                  Última actividad: {fechaCorta(ultima)}
                </p>
              )}
            </>
          )}
        </div>
        <span
          className={`mt-1 shrink-0 text-slate-400 transition ${expandido ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expandido && !sinActividad && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4 sm:space-y-5 sm:px-5 sm:pb-5">
          <Seccion titulo="Tests" vacio={alumno.tests.length === 0}>
            {alumno.tests.map((test, indice) => (
              <FilaActividad
                key={indice}
                titulo={test.titulo}
                metricas={metricasTest(test)}
              />
            ))}
          </Seccion>

          <Seccion titulo="Vocabulario" vacio={alumno.lecciones.length === 0}>
            {alumno.lecciones.map((leccion, indice) => (
              <FilaActividad
                key={indice}
                titulo={leccion.titulo}
                metricas={metricasLeccion(leccion)}
              />
            ))}
          </Seccion>

          <Seccion titulo="Memoria" vacio={alumno.memoria.length === 0}>
            {alumno.memoria.map((juego, indice) => (
              <FilaActividad
                key={indice}
                titulo={juego.titulo}
                metricas={metricasMemoria(juego)}
              />
            ))}
          </Seccion>
        </div>
      )}
    </article>
  );
}

const estilosCampo =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-muted";

export default function ProgresoDashboard({ alumnos }) {
  const [busqueda, setBusqueda] = useState("");
  const [nivel, setNivel] = useState("todos");
  const [orden, setOrden] = useState("nombre");
  const [expandidos, setExpandidos] = useState(() => new Set());

  const filtrados = useMemo(
    () => filtrarYOrdenarAlumnos(alumnos, { busqueda, nivel, orden }),
    [alumnos, busqueda, nivel, orden],
  );

  const resumen = useMemo(() => {
    const conActividad = alumnos.filter(
      (alumno) => contarActividad(alumno).total > 0,
    ).length;
    return {
      total: alumnos.length,
      conActividad,
      sinActividad: alumnos.length - conActividad,
    };
  }, [alumnos]);

  function toggleAlumno(id) {
    setExpandidos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function expandirTodos() {
    setExpandidos(
      new Set(
        filtrados
          .filter((alumno) => contarActividad(alumno).total > 0)
          .map((alumno) => alumno.id),
      ),
    );
  }

  function plegarTodos() {
    setExpandidos(new Set());
  }

  return (
    <>
      <PageHeader
        etiqueta="Seguimiento"
        titulo="Progreso de los alumnos"
        descripcion="Busca, filtra y revisa tests, vocabulario y memoria de cada alumno."
        className="mb-6 sm:mb-8"
      />

      {alumnos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 sm:p-10">
          Aún no hay alumnos registrados.
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-3 text-sm">
            <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="font-semibold text-slate-900">
                {resumen.total}
              </span>{" "}
              <span className="text-slate-500">alumnos</span>
            </p>
            <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="font-semibold text-emerald-700">
                {resumen.conActividad}
              </span>{" "}
              <span className="text-slate-500">con actividad</span>
            </p>
            <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="font-semibold text-amber-700">
                {resumen.sinActividad}
              </span>{" "}
              <span className="text-slate-500">sin actividad</span>
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block min-w-[12rem] flex-1 text-sm font-medium text-slate-700">
              Buscar alumno
              <input
                className={`mt-1.5 w-full ${estilosCampo}`}
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Nombre…"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Nivel
              <select
                className={`mt-1.5 w-full sm:w-36 ${estilosCampo}`}
                value={nivel}
                onChange={(event) => setNivel(event.target.value)}
              >
                <option value="todos">Todos</option>
                {NIVELES.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Ordenar
              <select
                className={`mt-1.5 w-full sm:w-48 ${estilosCampo}`}
                value={orden}
                onChange={(event) => setOrden(event.target.value)}
              >
                <option value="nombre">Nombre (A–Z)</option>
                <option value="actividad">Más actividad</option>
                <option value="inactivos">Sin actividad primero</option>
                <option value="reciente">Actividad reciente</option>
              </select>
            </label>

            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                onClick={expandirTodos}
              >
                Expandir
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                onClick={plegarTodos}
              >
                Plegar
              </button>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Ningún alumno coincide con el filtro.
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              {filtrados.map((alumno) => (
                <TarjetaAlumno
                  key={alumno.id}
                  alumno={alumno}
                  expandido={expandidos.has(alumno.id)}
                  onToggle={() => toggleAlumno(alumno.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
