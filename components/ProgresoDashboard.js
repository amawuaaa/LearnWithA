import PageHeader from "@/components/ui/PageHeader";
import { nivelBadgeClase } from "@/lib/niveles";

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
      valor: test.total ? `${test.puntuacion}/${test.total}` : String(test.puntuacion),
    },
    {
      etiqueta: "Intentos",
      valor: String(test.intentos),
    },
    {
      etiqueta: "Fecha",
      valor: fechaCorta(test.completado_en),
    },
  ];
}

function metricasLeccion(leccion) {
  return [
    {
      etiqueta: "Nota",
      valor: `${leccion.puntuacion}/${leccion.total}`,
    },
    {
      etiqueta: "Intentos",
      valor: String(leccion.intentos),
    },
    {
      etiqueta: "Fecha",
      valor: fechaCorta(leccion.completado_en),
    },
  ];
}

function metricasMemoria(juego) {
  return [
    {
      etiqueta: "Mejor",
      valor: `${juego.mejorIntentos} intentos`,
    },
    {
      etiqueta: "Partidas",
      valor: String(juego.partidas),
    },
    {
      etiqueta: "Última",
      valor: fechaCorta(juego.ultimaFecha),
    },
  ];
}

export default function ProgresoDashboard({ alumnos }) {
  return (
    <>
      <PageHeader
        etiqueta="Seguimiento"
        titulo="Progreso de los alumnos"
        descripcion="Tests, lecciones de vocabulario y juegos de memoria completados por cada alumno."
        className="mb-6 sm:mb-8"
      />

      {alumnos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 sm:p-10">
          Aún no hay alumnos registrados.
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {alumnos.map((alumno) => {
            const partidasMemoria = alumno.memoria.reduce(
              (suma, juego) => suma + juego.partidas,
              0,
            );
            const totalActividad =
              alumno.tests.length + alumno.lecciones.length + partidasMemoria;

            return (
              <article
                key={alumno.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
              >
                <header className="mb-4 border-b border-slate-100 pb-4 sm:mb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 flex-1 text-base font-semibold text-slate-900 sm:text-lg">
                      {alumno.nombre}
                    </h2>
                    <span className={nivelBadgeClase(alumno.nivel)}>
                      Nivel {alumno.nivel ?? "A1"}
                    </span>
                  </div>

                  {totalActividad === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">
                      Sin actividad registrada
                    </p>
                  ) : (
                    <ResumenAlumno
                      tests={alumno.tests.length}
                      lecciones={alumno.lecciones.length}
                      partidasMemoria={partidasMemoria}
                    />
                  )}
                </header>

                <div className="space-y-4 sm:space-y-5">
                  <Seccion titulo="Tests" vacio={alumno.tests.length === 0}>
                    {alumno.tests.map((test, indice) => (
                      <FilaActividad
                        key={indice}
                        titulo={test.titulo}
                        metricas={metricasTest(test)}
                      />
                    ))}
                  </Seccion>

                  <Seccion
                    titulo="Vocabulario"
                    vacio={alumno.lecciones.length === 0}
                  >
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
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
