"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
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
    const email = formData.get("email");
    const password = formData.get("password");

    if (esRegistro) {
      if (password !== formData.get("confirmarPassword")) {
        setError("Las contraseñas no coinciden.");
        setCargando(false);
        return;
      }

      let respuesta;
      let data;
      try {
        respuesta = await fetch("/api/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.get("nombre"),
            email,
            password,
            codigo: formData.get("codigo"),
          }),
        });
        data = await respuesta.json();
      } catch {
        setError("No se pudo conectar con el servidor.");
        setCargando(false);
        return;
      }

      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo crear la cuenta.");
        setCargando(false);
        return;
      }

      if (data.necesitaConfirmacion) {
        setMensaje(
          "Cuenta creada. Revisa tu email para confirmar la cuenta antes de entrar.",
        );
        setCargando(false);
        return;
      }
    } else {
      const supabase = createClient();
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
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <p className="mb-2 text-lg font-semibold tracking-tight text-slate-900">
            Learn<span className="text-accent">WithA</span>
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
            <>
              <label className="block text-sm font-medium text-slate-700">
                Nombre
                <Input
                  className="mt-2"
                  name="nombre"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Código de clase
                <Input
                  className="mt-2"
                  name="codigo"
                  type="password"
                  autoComplete="off"
                  required
                />
              </label>
            </>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Email
            <Input
              className="mt-2"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <Input
              className="mt-2"
              name="password"
              type="password"
              autoComplete={esRegistro ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>

          {!esRegistro && (
            <div className="-mt-3 text-right">
              <Link
                className="text-sm font-medium text-accent hover:underline"
                href="/recuperar-password"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

          {esRegistro && (
            <label className="block text-sm font-medium text-slate-700">
              Repetir contraseña
              <Input
                className="mt-2"
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

          <Button
            className="w-full"
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
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {esRegistro ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
          <Button
            variante="ghost"
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError("");
              setMensaje("");
            }}
          >
            {esRegistro ? "Inicia sesión" : "Regístrate"}
          </Button>
        </p>
      </Card>
    </main>
  );
}
