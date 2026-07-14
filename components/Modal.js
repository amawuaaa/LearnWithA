"use client";

import { useEffect, useRef } from "react";

const SELECTOR_ENFOCABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Modal({ abierto, titulo, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const panel = panelRef.current;
    const focoPrevio = document.activeElement;

    function enfocables() {
      return panel
        ? [...panel.querySelectorAll(SELECTOR_ENFOCABLE)].filter(
            (elemento) => !elemento.hasAttribute("disabled"),
          )
        : [];
    }

    function enfocarPrimero() {
      const [primero] = enfocables();
      (primero ?? panel)?.focus();
    }

    function cerrarConEscape(event) {
      if (event.key === "Escape") onClose();
    }

    function atraparTab(event) {
      if (event.key !== "Tab") return;

      const elementos = enfocables();
      if (elementos.length === 0) {
        event.preventDefault();
        return;
      }

      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      const activo = document.activeElement;

      if (event.shiftKey && activo === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && activo === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    }

    enfocarPrimero();
    document.addEventListener("keydown", cerrarConEscape);
    panel?.addEventListener("keydown", atraparTab);

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      panel?.removeEventListener("keydown", atraparTab);
      focoPrevio?.focus?.();
    };
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
      <section
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl outline-none"
      >
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
