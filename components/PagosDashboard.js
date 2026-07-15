"use client";

import PageHeader from "@/components/ui/PageHeader";
import PerfilMensualidades from "@/components/perfil/PerfilMensualidades";
import useMensualidades from "@/lib/hooks/useMensualidades";

export default function PagosDashboard({
  esAdmin,
  mensualidades,
  estudiantes,
  mensualidadesError,
}) {
  const dashboard = useMensualidades({ mensualidadesError });

  return (
    <>
      <PageHeader
        etiqueta="Cuenta"
        titulo="Pagos"
        descripcion={
          esAdmin
            ? "Genera y gestiona las mensualidades de tus alumnos."
            : "Consulta el estado de tus mensualidades."
        }
      />

      <PerfilMensualidades
        esAdmin={esAdmin}
        mensualidades={mensualidades}
        estudiantes={estudiantes}
        dashboard={dashboard}
      />
    </>
  );
}
