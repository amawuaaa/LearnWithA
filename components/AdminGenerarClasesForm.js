"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  mensajeErrorGeneracionClases,
  mensajeExitoGeneracionClases,
  normalizarResultadoGeneracion,
} from "@/lib/clases";
import { formatearFechaLocal } from "@/lib/horario";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const SELECT_CLASES =
  "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)";

export default function AdminGenerarClasesForm({ estudiantes, onGeneradas }) {
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [generando, setGenerando] = useState(false);

  async function generar(event) {
    event.preventDefault();
    setError("");
    setExito("");
    setGenerando(true);

    const formData = new FormData(event.currentTarget);
    const mes = String(formData.get("mes") ?? "").trim();

    if (!mes) {
      setError("Indica el mes a generar.");
      setGenerando(false);
      return;
    }

    if (estudiantes.length === 0) {
      setError("No hay alumnos registrados.");
      setGenerando(false);
      return;
    }

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("generar_clases_mes", {
      p_mes: `${mes}-01`,
      p_estudiante_id: null,
    });

    if (rpcError) {
      setGenerando(false);
      setError(mensajeErrorGeneracionClases(rpcError));
      return;
    }

    const resultado = normalizarResultadoGeneracion(data);
    if (!resultado) {
      setGenerando(false);
      setError(
        "La generación no devolvió resultado. Ejecuta la migración 026 en Supabase.",
      );
      return;
    }

    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - 30);
    const hasta = new Date(hoy);
    hasta.setDate(hasta.getDate() + 365);

    const { data: clasesActualizadas, error: fetchError } = await supabase
      .from("clases_estudiante")
      .select(SELECT_CLASES)
      .gte("fecha", formatearFechaLocal(desde))
      .lte("fecha", formatearFechaLocal(hasta))
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    setGenerando(false);

    if (fetchError) {
      setExito(mensajeExitoGeneracionClases({
        creadas: resultado.creadas ?? 0,
        omitidas: resultado.omitidas ?? 0,
        sinPlantilla: resultado.sin_plantilla ?? 0,
      }));
      return;
    }

    onGeneradas(clasesActualizadas ?? []);
    setExito(
      mensajeExitoGeneracionClases({
        creadas: resultado.creadas ?? 0,
        omitidas: resultado.omitidas ?? 0,
        sinPlantilla: resultado.sin_plantilla ?? 0,
      }),
    );
  }

  return (
    <form
      className="mb-6 rounded-xl border border-dashed border-accent/30 bg-accent-muted/30 p-4"
      onSubmit={generar}
    >
      <h3 className="font-semibold text-slate-900">Generar clases del mes</h3>
      <p className="mt-1 text-sm text-slate-500">
        Repite el patrón semanal de cada alumno (últimos 90 días). Los horarios
        que ya existan se omiten.
      </p>

      {estudiantes.length === 0 && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Necesitas al menos un alumno con clases programadas o un horario
          semanal de respaldo.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Mes
          <Input
            className="mt-2 w-48"
            name="mes"
            type="month"
            required
          />
        </label>

        <Button type="submit" disabled={generando || estudiantes.length === 0}>
          {generando ? "Generando…" : "Generar para todos"}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {exito && (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {exito}
        </p>
      )}
    </form>
  );
}
