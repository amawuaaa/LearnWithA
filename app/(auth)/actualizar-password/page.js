"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

function parseHashParams() {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, type };
}

function limpiarParamsSensibles() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token_hash");
  url.searchParams.delete("type");
  url.searchParams.delete("code");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export default function ActualizarPasswordPage() {
  const [error, setError] = useState("");
  const [actualizado, setActualizado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const supabase = createClient();

    async function prepararSesion() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      // Enlace del email con token_hash (recomendado; no depende de PKCE).
      if (tokenHash && type === "recovery") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        limpiarParamsSensibles();
        if (cancelado) return;

        if (otpError) {
          setSesionValida(false);
          setError(
            "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.",
          );
          setListo(true);
          return;
        }

        setSesionValida(true);
        setListo(true);
        return;
      }

      // Enlaces antiguos de Supabase con tokens en el hash (#access_token…).
      const hash = parseHashParams();
      if (hash?.accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: hash.accessToken,
          refresh_token: hash.refreshToken,
        });
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        if (cancelado) return;

        if (sessionError) {
          setSesionValida(false);
          setError(
            "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.",
          );
          setListo(true);
          return;
        }

        setSesionValida(true);
        setListo(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelado) return;

      if (!session) {
        setSesionValida(false);
        setError(
          "No hay una sesión de recuperación activa. Solicita un enlace nuevo.",
        );
      } else {
        setSesionValida(true);
      }
      setListo(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === "PASSWORD_RECOVERY" && session) {
        setSesionValida(true);
        setError("");
        setListo(true);
      }
    });

    prepararSesion();

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

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
        ) : !listo ? (
          <p className="mt-6 text-sm text-slate-500">Comprobando el enlace…</p>
        ) : !sesionValida ? (
          <div className="mt-6 space-y-4">
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
            <Link
              className="inline-block text-sm font-medium text-accent hover:underline"
              href="/recuperar-password"
            >
              Solicitar un enlace nuevo
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
