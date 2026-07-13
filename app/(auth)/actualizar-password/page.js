"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function ActualizarPasswordPage() {
  const [error, setError] = useState("");
  const [actualizado, setActualizado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function actualizarPassword(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");

    if (password !== formData.get("confirmarPassword")) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("No se pudo cambiar la contraseña. Solicita un enlace nuevo.");
      setCargando(false);
      return;
    }

    await supabase.auth.signOut();
    setActualizado(true);
    setCargando(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
          Learn<span className="text-accent">WithA</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Nueva contraseña
        </h1>

        {actualizado ? (
          <div className="mt-6">
            <p
              className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              Tu contraseña se ha actualizado correctamente.
            </p>
            <Link
              className="mt-5 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              href="/login"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-500">
              Elige una contraseña nueva de al menos 6 caracteres.
            </p>
            <form className="mt-7 space-y-5" onSubmit={actualizarPassword}>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña nueva
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-muted"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Repetir contraseña
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-muted"
                  name="confirmarPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              {error && (
                <p
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                type="submit"
                disabled={cargando}
              >
                {cargando ? "Actualizando…" : "Guardar contraseña"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
