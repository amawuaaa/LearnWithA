"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import ConfirmDialog from "../ConfirmDialog";

export default function PerfilCodigoRegistro({ codigoInicial }) {
  const [codigo, setCodigo] = useState(codigoInicial?.codigo ?? "");
  const [generando, setGenerando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function generarCodigo() {
    setConfirmando(false);
    setGenerando(true);
    setMensaje("");
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase
      .rpc("generar_codigo_registro")
      .single();

    setGenerando(false);

    if (rpcError || !data) {
      setError("No se pudo generar un código nuevo.");
      return;
    }

    setCodigo(data.codigo);
    setMensaje("Código generado. El anterior ya no funciona.");
  }

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigo);
      setMensaje("Código copiado.");
      setError("");
    } catch {
      setError("No se pudo copiar. Selecciona el código manualmente.");
    }
  }

  return (
    <>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Acceso de alumnos
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Comparte este código con los alumnos nuevos. Solo podrán crear una
              cuenta si lo introducen durante el registro.
            </p>
          </div>

          <button
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            type="button"
            disabled={generando}
            onClick={() => (codigo ? setConfirmando(true) : generarCodigo())}
          >
            {generando
              ? "Generando…"
              : codigo
                ? "Generar uno nuevo"
                : "Generar código"}
          </button>
        </div>

        {codigo && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Código activo
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.25em] text-slate-900">
                {codigo}
              </p>
            </div>
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              type="button"
              onClick={copiarCodigo}
            >
              Copiar código
            </button>
          </div>
        )}

        {!codigo && (
          <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Todavía no existe un código activo. Los alumnos no pueden
            registrarse hasta que generes uno.
          </p>
        )}

        {mensaje && (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            {mensaje}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Generar un código nuevo"
        mensaje="El código actual dejará de funcionar inmediatamente. Los alumnos deberán usar el nuevo."
        confirmLabel="Generar código"
        peligroso={false}
        cargando={generando}
        onConfirm={generarCodigo}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
