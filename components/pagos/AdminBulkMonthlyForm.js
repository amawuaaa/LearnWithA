"use client";

import {
  mensajeErrorMensualidad,
  mensajeExitoGeneracion,
} from "@/lib/mensualidades";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

function normalizarResultadoGeneracion(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export default function AdminBulkMonthlyForm({ estudiantes, onSaved }) {
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [generando, setGenerando] = useState(false);

  async function generar(event) {
    event.preventDefault();
    setError("");
    setExito("");
    setGenerando(true);

    const formData = new FormData(event.currentTarget);
    const periodoMes = String(formData.get("periodo") ?? "").trim();
    const fechaVencimiento = String(
      formData.get("fecha_vencimiento") ?? "",
    ).trim();
    const importe = Number(formData.get("importe"));

    if (!periodoMes || !fechaVencimiento) {
      setError("Completa el mes y la fecha de vencimiento.");
      setGenerando(false);
      return;
    }

    if (!Number.isFinite(importe) || importe < 0) {
      setError("El importe no es válido.");
      setGenerando(false);
      return;
    }

    if (estudiantes.length === 0) {
      setError(
        "No hay estudiantes registrados. Primero deben crear su cuenta con el código de clase.",
      );
      setGenerando(false);
      return;
    }

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc(
      "generar_mensualidades_mes",
      {
        p_periodo: `${periodoMes}-01`,
        p_importe: importe,
        p_fecha_vencimiento: fechaVencimiento,
      },
    );

    setGenerando(false);

    if (rpcError) {
      setError(mensajeErrorMensualidad(rpcError));
      return;
    }

    const resultado = normalizarResultadoGeneracion(data);
    if (!resultado) {
      setError(
        "La generación no devolvió resultado. Ejecuta: pnpm exec supabase db push",
      );
      return;
    }

    setExito(
      mensajeExitoGeneracion({
        creadas: resultado.creadas ?? 0,
        omitidas: resultado.omitidas ?? 0,
        total: estudiantes.length,
      }),
    );
    onSaved();
  }

  return (
    <form
      className="rounded-xl border border-dashed border-accent/30 bg-accent-muted/30 p-4"
      onSubmit={generar}
    >
      <h3 className="font-semibold text-slate-900">
        Generar mensualidades del mes
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Crea una mensualidad pendiente para cada alumno ({estudiantes.length}{" "}
        {estudiantes.length === 1 ? "alumno" : "alumnos"}). Los que ya tengan
        ese mes se omiten.
      </p>

      {estudiantes.length === 0 && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Necesitas al menos un alumno registrado para generar mensualidades.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          Mes
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            name="periodo"
            type="month"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Importe (€)
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            name="importe"
            type="number"
            min="0"
            step="0.01"
            placeholder="50.00"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Vencimiento
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            name="fecha_vencimiento"
            type="date"
            required
          />
        </label>
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

      <button
        className="mt-4 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        type="submit"
        disabled={generando || estudiantes.length === 0}
      >
        {generando ? "Generando…" : "Generar para todos los alumnos"}
      </button>
    </form>
  );
}
