"use client";

import PageHeader from "@/components/ui/PageHeader";
import useProfileDashboard from "@/lib/hooks/useProfileDashboard";
import Link from "next/link";
import PerfilAvatar from "./perfil/PerfilAvatar";
import PerfilCodigoRegistro from "./perfil/PerfilCodigoRegistro";
import PerfilListaAlumnos from "./perfil/PerfilListaAlumnos";

export default function ProfileDashboard({
  usuario,
  perfil,
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
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">Mensualidades</p>
              <p className="mt-1 text-sm text-slate-600">
                {esAdmin
                  ? "Gestiona importes y estados en la sección de pagos."
                  : "Consulta tus pagos en la sección dedicada."}
              </p>
              <Link
                href="/pagos"
                className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
              >
                Ir a pagos
              </Link>
            </div>
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
