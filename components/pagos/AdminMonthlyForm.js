"use client";

import { mensajeErrorMensualidad } from "@/lib/mensualidades";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AdminMonthlyForm({
  mensualidad,
  estudiantes,
  onSaved,
}) {
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(event) {
    event.preventDefault();
    setError("");
    setGuardando(true);

    const formData = new FormData(event.currentTarget);
    const estudianteId = String(formData.get("estudiante_id") ?? "").trim();
    const periodoMes = String(formData.get("periodo") ?? "").trim();
    const fechaVencimiento = String(
      formData.get("fecha_vencimiento") ?? "",
    ).trim();
    const estado = String(formData.get("estado") ?? "pendiente").trim();
    const importe = Number(formData.get("importe"));

    if (!estudianteId) {
      setError("Selecciona un estudiante.");
      setGuardando(false);
      return;
    }

    if (!periodoMes) {
      setError("Selecciona el mes de la mensualidad.");
      setGuardando(false);
      return;
    }

    if (!fechaVencimiento) {
      setError("Indica la fecha de vencimiento.");
      setGuardando(false);
      return;
    }

    if (!Number.isFinite(importe) || importe < 0) {
      setError("El importe no es válido.");
      setGuardando(false);
      return;
    }

    if (estudiantes.length === 0) {
      setError(
        "No hay estudiantes registrados. Primero deben crear su cuenta con el código de clase.",
      );
      setGuardando(false);
      return;
    }

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("guardar_mensualidad_admin", {
      p_estudiante_id: estudianteId,
      p_periodo: `${periodoMes}-01`,
      p_importe: importe,
      p_fecha_vencimiento: fechaVencimiento,
      p_estado: estado,
      p_id: mensualidad?.id ?? null,
    });

    setGuardando(false);

    if (rpcError) {
      setError(mensajeErrorMensualidad(rpcError));
      return;
    }

    onSaved();
  }

  return (
    <form className="space-y-5" onSubmit={guardar}>
      {estudiantes.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Aún no hay alumnos registrados. Comparte el código de clase para que
          puedan crear su cuenta.
        </p>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Estudiante
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent disabled:bg-slate-100"
          name="estudiante_id"
          defaultValue={mensualidad?.estudiante_id ?? ""}
          disabled={estudiantes.length === 0}
          required
        >
          <option value="">Selecciona un estudiante</option>
          {estudiantes.map((estudiante) => (
            <option key={estudiante.id} value={estudiante.id}>
              {estudiante.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Mes
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            name="periodo"
            type="month"
            defaultValue={mensualidad?.periodo?.slice(0, 7)}
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
            defaultValue={mensualidad?.importe}
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Fecha de vencimiento
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            name="fecha_vencimiento"
            type="date"
            defaultValue={mensualidad?.fecha_vencimiento}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Estado
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent"
            name="estado"
            defaultValue={mensualidad?.estado ?? "pendiente"}
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="vencida">Vencida</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        type="submit"
        disabled={guardando || estudiantes.length === 0}
      >
        {guardando ? "Guardando…" : "Guardar mensualidad"}
      </button>
    </form>
  );
}
