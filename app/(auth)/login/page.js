"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [esRegistro, setEsRegistro] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviarFormulario(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const email = formData.get("email");
    const password = formData.get("password");

    if (esRegistro) {
      if (password !== formData.get("confirmarPassword")) {
        setError("Las contraseñas no coinciden.");
        setCargando(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: formData.get("nombre").trim(),
          },
        },
      });

      if (authError) {
        setError(
          authError.message.includes("already registered")
            ? "Ya existe una cuenta con este email."
            : "No se pudo crear la cuenta. Revisa los datos.",
        );
        setCargando(false);
        return;
      }

      if (!data.session) {
        setMensaje(
          "Cuenta creada. Revisa tu email para confirmar la cuenta antes de entrar.",
        );
        setCargando(false);
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("El email o la contraseña no son correctos.");
        setCargando(false);
        return;
      }
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
            Portal de Clase
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {esRegistro ? "Crear una cuenta" : "Iniciar sesión"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {esRegistro
              ? "Regístrate como estudiante para acceder al portal."
              : "Accede con el email y la contraseña de tu cuenta."}
          </p>
        </div>

        <form
          key={esRegistro ? "registro" : "login"}
          className="space-y-5"
          onSubmit={enviarFormulario}
        >
          {esRegistro && (
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
                name="nombre"
                autoComplete="name"
                required
                maxLength={100}
              />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
              name="password"
              type="password"
              autoComplete={esRegistro ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>

          {esRegistro && (
            <label className="block text-sm font-medium text-slate-700">
              Repetir contraseña
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
                name="confirmarPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {mensaje}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? esRegistro
                ? "Creando cuenta…"
                : "Entrando…"
              : esRegistro
                ? "Crear cuenta"
                : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {esRegistro ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
          <button
            className="font-medium text-accent hover:underline"
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError("");
              setMensaje("");
            }}
          >
            {esRegistro ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </section>
    </main>
  );
}
