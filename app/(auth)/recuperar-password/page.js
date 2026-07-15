"use client";

import { createClient } from "@/lib/supabase/client";
import { urlCallbackRecuperarPassword } from "@/lib/siteUrl";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const MENSAJES_ERROR = {
  enlace:
    "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.",
  sesion:
    "No hay una sesión de recuperación activa. Solicita un enlace nuevo desde aquí.",
};

function FormularioRecuperar() {
  const searchParams = useSearchParams();
  const errorUrl = searchParams.get("error");
  const [error, setError] = useState(MENSAJES_ERROR[errorUrl] ?? "");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviarEnlace(event) {
    event.preventDefault();
    setError("");
    setCargando(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const supabase = createClient();
    // Nunca enviar redirect_to=localhost: los emails deben ir a producción.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: urlCallbackRecuperarPassword(),
      },
    );

    setCargando(false);

    if (resetError) {
      setError(
        "No se pudo enviar el enlace. Espera un momento e inténtalo de nuevo.",
      );
      return;
    }

    // El mensaje no confirma si el email existe, evitando revelar cuentas.
    setEnviado(true);
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
        Learn<span className="text-accent">WithA</span>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Recuperar contraseña
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Introduce tu email y recibirás un enlace para crear una contraseña
        nueva.
      </p>

      {enviado ? (
        <div className="mt-7">
          <p
            className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            Si existe una cuenta con ese email, recibirás un enlace de
            recuperación en unos minutos. Revisa también la carpeta de spam.
          </p>
          <Link
            className="mt-5 inline-block text-sm font-medium text-accent hover:underline"
            href="/login"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={enviarEnlace}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-muted"
              name="email"
              type="email"
              autoComplete="email"
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
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
            type="submit"
            disabled={cargando}
          >
            {cargando ? "Enviando…" : "Enviar enlace"}
          </button>

          <Link
            className="block text-center text-sm font-medium text-accent hover:underline"
            href="/login"
          >
            Volver al inicio de sesión
          </Link>
        </form>
      )}
    </section>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-500">Cargando…</p>
          </section>
        }
      >
        <FormularioRecuperar />
      </Suspense>
    </main>
  );
}
