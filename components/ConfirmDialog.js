"use client";

import Modal from "./Modal";

export default function ConfirmDialog({
  abierto,
  titulo = "Confirmar",
  mensaje,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  peligroso = true,
  cargando = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal abierto={abierto} titulo={titulo} onClose={onCancel}>
      <p className="text-sm text-slate-600">{mensaje}</p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
          disabled={cargando}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
            peligroso
              ? "bg-red-600 hover:bg-red-700"
              : "bg-accent hover:bg-accent-hover"
          }`}
          type="button"
          disabled={cargando}
          onClick={onConfirm}
        >
          {cargando ? "Un momento…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
