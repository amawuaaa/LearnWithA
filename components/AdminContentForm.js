"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AdminContentForm({
  contenido,
  tipoInicial,
  permitirVerbos,
  onSaved,
}) {
  const [tipo, setTipo] = useState(contenido?.tipo ?? tipoInicial);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(event) {
    event.preventDefault();
    setError("");
    setGuardando(true);

    const formData = new FormData(event.currentTarget);
    const valores = {
      tipo,
      titulo: formData.get("titulo").trim(),
      descripcion: formData.get("descripcion").trim(),
      url: tipo === "juego" ? formData.get("url").trim() : null,
    };
    const supabase = createClient();
    const consulta = contenido
      ? supabase
          .from("contenido_didactico")
          .update(valores)
          .eq("id", contenido.id)
      : supabase.from("contenido_didactico").insert(valores);
    const { error: queryError } = await consulta;

    if (queryError) {
      setError("No se pudo guardar el contenido.");
      setGuardando(false);
      return;
    }

    onSaved();
  }

  return (
    <form className="space-y-5" onSubmit={guardar}>
      {permitirVerbos && (
        <label className="block text-sm font-medium text-slate-700">
          Tipo
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-accent"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
          >
            <option value="vocabulario">Vocabulario</option>
            <option value="verbo">Verbo</option>
          </select>
        </label>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Título
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
          name="titulo"
          defaultValue={contenido?.titulo}
          required
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Descripción
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
          name="descripcion"
          defaultValue={contenido?.descripcion}
          required
        />
      </label>

      {tipo === "juego" && (
        <label className="block text-sm font-medium text-slate-700">
          Enlace al juego
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent"
            name="url"
            type="url"
            defaultValue={contenido?.url}
            placeholder="https://..."
            required
          />
        </label>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        disabled={guardando}
        type="submit"
      >
        {guardando
          ? "Guardando…"
          : contenido
            ? "Guardar cambios"
            : "Añadir contenido"}
      </button>
    </form>
  );
}
