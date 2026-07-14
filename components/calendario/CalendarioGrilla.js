"use client";

import Button from "@/components/ui/Button";
import {
  NOMBRES_DIAS_CORTOS,
  clasesPorFecha,
  formatearFechaLocal,
  formatearHora,
} from "@/lib/horario";

const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function CalendarioGrilla({ cal }) {
  function etiquetaClaseCelda(clasesDia) {
    const activas = clasesDia.filter((clase) => !clase.cancelada);
    if (activas.length === 0) {
      const canceladas = clasesDia.length;
      return canceladas > 0 ? `${canceladas} cancel.` : null;
    }

    if (cal.esAdmin) {
      return activas.length === 1
        ? `${formatearHora(activas[0].hora)} · 1`
        : `${activas.length} clases`;
    }

    return activas
      .slice(0, 2)
      .map((clase) => formatearHora(clase.hora))
      .join(", ");
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => cal.cambiarMes(-1)}
          >
            ‹
          </button>
          <h2 className="min-w-0 text-center font-semibold text-slate-900">
            {NOMBRES_MESES[cal.mesVisible.getMonth()]}{" "}
            {cal.mesVisible.getFullYear()}
            {cal.cargandoMes && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                Cargando…
              </span>
            )}
          </h2>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => cal.cambiarMes(1)}
          >
            ›
          </button>
        </div>
        <Button variante="secondary" type="button" onClick={cal.irAHoy}>
          Hoy
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        {NOMBRES_DIAS_CORTOS.map((dia, indice) => (
          <div key={indice} className="py-1">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cal.grilla.map(({ fecha, enMes }) => {
          const fechaStr = formatearFechaLocal(fecha);
          const clasesDia = clasesPorFecha(cal.clasesVisibles, fechaStr);
          const clasesActivas = clasesDia.filter((clase) => !clase.cancelada);
          const eventosDia = cal.eventosPorFecha[fechaStr] ?? [];
          const tieneClase = cal.fechasClaseSet.has(fechaStr);
          const esHoy = fechaStr === cal.hoyStr;
          const etiqueta = etiquetaClaseCelda(clasesDia);

          let clasesCelda =
            "flex min-h-16 flex-col items-center justify-start gap-0.5 rounded-lg p-1 text-sm transition";

          if (!enMes) {
            clasesCelda += " text-slate-300";
          } else if (
            clasesActivas.length === 0 &&
            clasesDia.some((clase) => clase.cancelada)
          ) {
            clasesCelda += " bg-red-50 text-red-700";
          } else if (tieneClase && clasesActivas.length > 0) {
            clasesCelda += " bg-accent-muted font-semibold text-accent";
          } else if (eventosDia.length > 0) {
            clasesCelda += " bg-slate-50 text-slate-700";
          } else {
            clasesCelda += " text-slate-600 hover:bg-slate-50";
          }

          if (esHoy) {
            clasesCelda += " ring-2 ring-accent ring-offset-1";
          }

          if (enMes) {
            clasesCelda += " cursor-pointer hover:shadow-sm";
          }

          const contenido = (
            <>
              <span className="font-semibold">{fecha.getDate()}</span>
              {enMes && etiqueta && (
                <span className="line-clamp-2 w-full px-0.5 text-[9px] font-medium leading-tight">
                  {etiqueta}
                </span>
              )}
              {enMes && eventosDia.length > 0 && (
                <div className="mt-auto flex flex-wrap justify-center gap-0.5">
                  {eventosDia.slice(0, 3).map((evento) => (
                    <span
                      key={evento.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        evento.tipo === "examen"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                      }`}
                      title={evento.titulo}
                    />
                  ))}
                </div>
              )}
            </>
          );

          if (enMes) {
            return (
              <button
                key={fechaStr}
                type="button"
                className={clasesCelda}
                onClick={() => cal.abrirDia(fecha)}
              >
                {contenido}
              </button>
            );
          }

          return (
            <div key={fechaStr} className={clasesCelda}>
              {contenido}
            </div>
          );
        })}
      </div>
    </>
  );
}
