"use client";

import { useEffect } from "react";

export default function Modal({ abierto, titulo, onClose, children }) {
  useEffect(() => {
    if (!abierto) return undefined;

    function cerrarConEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{titulo}</h2>
          <button
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            type="button"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
