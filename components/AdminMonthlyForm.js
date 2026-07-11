"use client";

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
    const valores = {
      estudiante_id: formData.get("estudiante_id"),
      periodo: `${formData.get("periodo")}-01`,
      importe: Number(formData.get("importe")),
      fecha_vencimiento: formData.get("fecha_vencimiento"),
      estado: formData.get("estado"),
    };
    const supabase = createClient();
    const consulta = mensualidad
      ? supabase
          .from("mensualidades")
          .update(valores)
          .eq("id", mensualidad.id)
      : supabase.from("mensualidades").insert(valores);
    const { error: queryError } = await consulta;

    if (queryError) {
      setError(
        queryError.code === "23505"
          ? "Este alumno ya tiene una mensualidad para ese mes."
          : "No se pudo guardar la mensualidad.",
      );
      setGuardando(false);
      return;
    }

    onSaved();
  }

  return (
    <form className="space-y-5" onSubmit={guardar}>
      <label className="block text-sm font-medium text-slate-700">
        Estudiante
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent"
          name="estudiante_id"
          defaultValue={mensualidad?.estudiante_id}
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

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        type="submit"
        disabled={guardando}
      >
        {guardando ? "Guardando…" : "Guardar mensualidad"}
      </button>
    </form>
  );
}
