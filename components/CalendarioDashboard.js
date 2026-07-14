"use client";

import PageHeader from "@/components/ui/PageHeader";
import useCalendarioDashboard from "@/lib/hooks/useCalendarioDashboard";
import AdminGenerarClasesForm from "./AdminGenerarClasesForm";
import CalendarioDiaModal from "./calendario/CalendarioDiaModal";
import CalendarioGrilla from "./calendario/CalendarioGrilla";
import CalendarioLeyenda from "./calendario/CalendarioLeyenda";

export default function CalendarioDashboard(props) {
  const cal = useCalendarioDashboard(props);

  return (
    <>
      <PageHeader
        etiqueta="Horario"
        titulo="Calendario"
        descripcion={
          cal.esAdmin
            ? "Programa clases por día, hora y alumno. Añade exámenes o avisos cuando lo necesites."
            : "Consulta tus clases, exámenes y avisos del mes."
        }
      />

      {cal.esAdmin && (
        <AdminGenerarClasesForm
          estudiantes={cal.estudiantes}
          onGeneradas={cal.actualizarClases}
        />
      )}

      {cal.error && (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {cal.error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <CalendarioGrilla cal={cal} />
        <CalendarioLeyenda />
      </section>

      <CalendarioDiaModal cal={cal} />
    </>
  );
}
