"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatAttachment({ adjunto, propio }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const esImagen = adjunto.tipo?.startsWith("image/");

  useEffect(() => {
    let activo = true;
    const supabase = createClient();

    async function crearEnlace() {
      const { data, error: signedUrlError } = await supabase.storage
        .from("archivos_chat")
        .createSignedUrl(adjunto.path, 60 * 60);

      if (!activo) return;
      if (signedUrlError || !data?.signedUrl) {
        setError(true);
        return;
      }
      setUrl(data.signedUrl);
    }

    crearEnlace();
    return () => {
      activo = false;
    };
  }, [adjunto.path]);

  if (error) {
    return (
      <p className={`text-xs ${propio ? "text-teal-100" : "text-red-600"}`}>
        No se pudo abrir {adjunto.nombre}.
      </p>
    );
  }

  if (!url) {
    return (
      <div
        className={`h-12 animate-pulse rounded-lg ${
          propio ? "bg-white/15" : "bg-slate-100"
        }`}
      />
    );
  }

  if (esImagen) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {/* Las imágenes usan enlaces privados temporales de Supabase. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="max-h-72 w-full rounded-lg object-cover"
          src={url}
          alt={adjunto.nombre}
        />
      </a>
    );
  }

  return (
    <a
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
        propio
          ? "border-white/25 bg-white/10 hover:bg-white/15"
          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
      }`}
      href={url}
      target="_blank"
      rel="noreferrer"
      download={adjunto.nombre}
    >
      <span className="text-xl" aria-hidden="true">
        📎
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {adjunto.nombre}
        </span>
        <span
          className={`block text-xs ${
            propio ? "text-teal-100" : "text-slate-500"
          }`}
        >
          {formatearTamano(adjunto.tamano)}
        </span>
      </span>
    </a>
  );
}
