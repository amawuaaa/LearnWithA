"use client";

import PageHeader from "@/components/ui/PageHeader";
import { estilosEstadoMensualidad as estilosEstado } from "@/lib/mensualidades";
import useProfileDashboard from "@/lib/hooks/useProfileDashboard";
import Link from "next/link";
import PerfilAvatar from "./perfil/PerfilAvatar";
import PerfilCodigoRegistro from "./perfil/PerfilCodigoRegistro";
import PerfilListaAlumnos from "./perfil/PerfilListaAlumnos";
import { importeLegible } from "./perfil/PerfilMensualidades";

export default function ProfileDashboard({
  usuario,
  perfil,
  ultimaMensualidad,
  estudiantes,
  testsCompletados,
  codigoRegistro,
}) {
  const esAdmin = perfil.rol === "admin";
  const dashboard = useProfileDashboard({ usuario, perfil });

  return (
    <>
      <PageHeader
        etiqueta="Cuenta"
        titulo="Mi perfil"
        descripcion="Consulta tus datos personales y la información de la clase."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <PerfilAvatar usuario={usuario} perfil={perfil} dashboard={dashboard} />

        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Resumen</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm text-slate-500">
                {esAdmin ? "Resultados registrados" : "Tests completados"}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {testsCompletados}
              </p>
            </div>
            {!esAdmin && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">Tu nivel actual</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {perfil.nivel ?? "A1"}
                </p>
              </div>
            )}
            {!esAdmin && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">Última mensualidad</p>
                {ultimaMensualidad ? (
                  <>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {importeLegible(ultimaMensualidad.importe)}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilosEstado[ultimaMensualidad.estado]}`}
                    >
                      {ultimaMensualidad.estado}
                    </span>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Sin mensualidades registradas
                  </p>
                )}
                <Link
                  href="/pagos"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Ver todos los pagos
                </Link>
              </div>
            )}
            {esAdmin && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">Mensualidades</p>
                <Link
                  href="/pagos"
                  className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Ir a gestión de pagos
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {esAdmin && <PerfilCodigoRegistro codigoInicial={codigoRegistro} />}

      {esAdmin && (
        <PerfilListaAlumnos estudiantes={estudiantes} dashboard={dashboard} />
      )}
    </>
  );
}
