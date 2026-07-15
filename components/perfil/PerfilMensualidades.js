"use client";

import Button from "@/components/ui/Button";
import { estilosEstadoMensualidad as estilosEstado } from "@/lib/mensualidades";
import AdminBulkMonthlyForm from "../AdminBulkMonthlyForm";
import AdminMonthlyForm from "../AdminMonthlyForm";
import ConfirmDialog from "../ConfirmDialog";
import Modal from "../Modal";

function fechaLegible(fecha, opciones = {}) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-ES", opciones);
}

function periodoLegible(periodo) {
  return fechaLegible(periodo, { month: "long", year: "numeric" });
}

function importeLegible(importe) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(importe);
}

function EstadoMensualidad({ estado }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilosEstado[estado]}`}
    >
      {estado}
    </span>
  );
}

function TablaAlumno({ mensualidades }) {
  return (
    <section className="mt-2">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Mes</th>
              <th className="px-4 py-3 font-medium">Importe</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mensualidades.map((mensualidad) => (
              <tr key={mensualidad.id}>
                <td className="px-4 py-3 capitalize">
                  {periodoLegible(mensualidad.periodo)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {importeLegible(mensualidad.importe)}
                </td>
                <td className="px-4 py-3">
                  {fechaLegible(mensualidad.fecha_vencimiento)}
                </td>
                <td className="px-4 py-3">
                  <EstadoMensualidad estado={mensualidad.estado} />
                </td>
              </tr>
            ))}
            {mensualidades.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan="4">
                  No hay mensualidades registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GestionAdmin({ mensualidades, estudiantes, dashboard }) {
  return (
    <section className="mt-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Gestión de mensualidades
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Genera el mes para todos los alumnos o registra casos puntuales.
          </p>
          {dashboard.errorMensualidades && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {dashboard.errorMensualidades}
            </p>
          )}
        </div>
        <Button type="button" onClick={() => dashboard.abrirMensualidad()}>
          Nueva mensualidad
        </Button>
      </div>

      <AdminBulkMonthlyForm
        estudiantes={estudiantes}
        onSaved={() => dashboard.router.refresh()}
      />

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Alumno</th>
              <th className="px-4 py-3 font-medium">Mes</th>
              <th className="px-4 py-3 font-medium">Importe</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mensualidades.map((mensualidad) => (
              <tr key={mensualidad.id}>
                <td className="px-4 py-3">
                  {mensualidad.usuarios?.nombre ?? "Alumno"}
                </td>
                <td className="px-4 py-3 capitalize">
                  {periodoLegible(mensualidad.periodo)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {importeLegible(mensualidad.importe)}
                </td>
                <td className="px-4 py-3">
                  <EstadoMensualidad estado={mensualidad.estado} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Button
                      variante="enlace"
                      type="button"
                      onClick={() => dashboard.abrirMensualidad(mensualidad)}
                    >
                      Editar
                    </Button>
                    <Button
                      variante="enlacePeligro"
                      type="button"
                      onClick={() =>
                        dashboard.solicitarBorradoMensualidad(mensualidad)
                      }
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {mensualidades.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                  Aún no hay mensualidades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PerfilMensualidades({
  esAdmin,
  mensualidades,
  estudiantes,
  dashboard,
}) {
  if (!esAdmin) {
    return <TablaAlumno mensualidades={mensualidades} />;
  }

  return (
    <>
      <GestionAdmin
        mensualidades={mensualidades}
        estudiantes={estudiantes}
        dashboard={dashboard}
      />

      <Modal
        abierto={dashboard.modalAbierto}
        titulo={
          dashboard.mensualidadEditando
            ? "Editar mensualidad"
            : "Nueva mensualidad"
        }
        onClose={() => dashboard.setModalAbierto(false)}
      >
        <AdminMonthlyForm
          key={dashboard.mensualidadEditando?.id ?? "nueva"}
          mensualidad={dashboard.mensualidadEditando}
          estudiantes={estudiantes}
          onSaved={dashboard.mensualidadGuardada}
        />
      </Modal>

      <ConfirmDialog
        abierto={dashboard.borrandoMensualidad !== null}
        titulo="Eliminar mensualidad"
        mensaje="¿Eliminar esta mensualidad? Esta acción no se puede deshacer."
        cargando={dashboard.eliminandoMensualidad}
        error={dashboard.errorBorradoMensualidad}
        onConfirm={dashboard.confirmarBorradoMensualidad}
        onCancel={() => dashboard.setBorrandoMensualidad(null)}
      />
    </>
  );
}

export { importeLegible };
