"use client";

import { NIVELES } from "@/lib/niveles";

export default function PerfilListaAlumnos({ estudiantes, dashboard }) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Nivel de los alumnos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sube el nivel de un alumno cuando esté listo para el siguiente
          reto. Los tests y el vocabulario de niveles superiores
          quedarán desbloqueados para él.
        </p>
        {dashboard.errorNivel && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {dashboard.errorNivel}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Alumno</th>
              <th className="px-4 py-3 font-medium">Nivel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estudiantes.map((estudiante) => (
              <tr key={estudiante.id}>
                <td className="px-4 py-3">{estudiante.nombre}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
                    value={estudiante.nivel ?? "A1"}
                    onChange={(event) =>
                      dashboard.cambiarNivelEstudiante(
                        estudiante.id,
                        event.target.value,
                      )
                    }
                  >
                    {NIVELES.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {estudiantes.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan="2">
                  Aún no hay alumnos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
