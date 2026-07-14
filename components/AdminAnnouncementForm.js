"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AdminAnnouncementForm({
  anuncio,
  autorId,
  autorNombre,
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
      titulo: formData.get("titulo").trim(),
      contenido: formData.get("contenido").trim(),
    };
    const supabase = createClient();

    const consulta = anuncio
      ? supabase
          .from("anuncios")
          .update(valores)
          .eq("id", anuncio.id)
          .select()
          .single()
      : supabase
          .from("anuncios")
          .insert({ ...valores, autor_id: autorId })
          .select()
          .single();

    const { data, error: queryError } = await consulta;

    if (queryError) {
      setError("No se pudo guardar el anuncio. Inténtalo de nuevo.");
      setGuardando(false);
      return;
    }

    onSaved({ ...data, usuarios: { nombre: autorNombre } });
  }

  return (
    <form className="space-y-5" onSubmit={guardar}>
      <label className="block text-sm font-medium text-slate-700">
        Título
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted"
          name="titulo"
          defaultValue={anuncio?.titulo}
          required
          maxLength={120}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Contenido
        <textarea
          className="mt-2 min-h-36 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted"
          name="contenido"
          defaultValue={anuncio?.contenido}
          required
        />
      </label>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        disabled={guardando}
        type="submit"
      >
        {guardando ? "Guardando…" : anuncio ? "Guardar cambios" : "Publicar"}
      </button>
    </form>
  );
}
