import PageHeader from "@/components/ui/PageHeader";
import { nivelBadgeClase } from "@/lib/niveles";

function fechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Seccion({ titulo, vacio, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </h3>
      {vacio ? (
        <p className="mt-2 text-sm text-slate-400">Sin actividad todavía.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">{children}</ul>
      )}
    </div>
  );
}

function Fila({ titulo, detalle }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm">
      <span className="min-w-0 truncate text-slate-800">{titulo}</span>
      <span className="shrink-0 text-slate-500">{detalle}</span>
    </li>
  );
}

export default function ProgresoDashboard({ alumnos }) {
  return (
    <>
      <PageHeader
        etiqueta="Seguimiento"
        titulo="Progreso de los alumnos"
        descripcion="Tests, lecciones de vocabulario y juegos de memoria completados por cada alumno."
      />

      {alumnos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aún no hay alumnos registrados.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {alumnos.map((alumno) => {
            const totalActividad =
              alumno.tests.length +
              alumno.lecciones.length +
              alumno.memoria.reduce((suma, juego) => suma + juego.partidas, 0);

            return (
              <article
                key={alumno.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {alumno.nombre}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {totalActividad === 0
                        ? "Sin actividad registrada"
                        : `${alumno.tests.length} tests · ${alumno.lecciones.length} lecciones · ${alumno.memoria.reduce((suma, juego) => suma + juego.partidas, 0)} partidas de memoria`}
                    </p>
                  </div>
                  <span className={nivelBadgeClase(alumno.nivel)}>
                    Nivel {alumno.nivel ?? "A1"}
                  </span>
                </div>

                <div className="space-y-5">
                  <Seccion titulo="Tests" vacio={alumno.tests.length === 0}>
                    {alumno.tests.map((test, indice) => (
                      <Fila
                        key={indice}
                        titulo={test.titulo}
                        detalle={`${test.puntuacion}${test.total ? `/${test.total}` : ""} · ${test.intentos} ${test.intentos === 1 ? "intento" : "intentos"} · ${fechaCorta(test.completado_en)}`}
                      />
                    ))}
                  </Seccion>

                  <Seccion
                    titulo="Vocabulario"
                    vacio={alumno.lecciones.length === 0}
                  >
                    {alumno.lecciones.map((leccion, indice) => (
                      <Fila
                        key={indice}
                        titulo={leccion.titulo}
                        detalle={`${leccion.puntuacion}/${leccion.total} · ${leccion.intentos} ${leccion.intentos === 1 ? "intento" : "intentos"} · ${fechaCorta(leccion.completado_en)}`}
                      />
                    ))}
                  </Seccion>

                  <Seccion titulo="Memoria" vacio={alumno.memoria.length === 0}>
                    {alumno.memoria.map((juego, indice) => (
                      <Fila
                        key={indice}
                        titulo={juego.titulo}
                        detalle={`mejor: ${juego.mejorIntentos} intentos · ${juego.partidas} ${juego.partidas === 1 ? "partida" : "partidas"} · ${fechaCorta(juego.ultimaFecha)}`}
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
