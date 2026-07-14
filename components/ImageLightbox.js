"use client";

import { useEffect } from "react";

export default function ImageLightbox({ abierto, src, alt, onClose }) {
  useEffect(() => {
    if (!abierto) return undefined;

    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function cerrarConEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = scrollPrevio;
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg font-medium text-slate-700 shadow hover:bg-white"
        onClick={onClose}
        aria-label="Cerrar imagen"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
        src={src}
        alt={alt}
      />
    </div>
  );
}
