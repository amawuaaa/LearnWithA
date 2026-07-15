"use client";

import PageHeader from "@/components/ui/PageHeader";
import MensualidadesPanel from "@/components/pagos/MensualidadesPanel";
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

      <MensualidadesPanel
        esAdmin={esAdmin}
        mensualidades={mensualidades}
        estudiantes={estudiantes}
        dashboard={dashboard}
      />
    </>
  );
}
