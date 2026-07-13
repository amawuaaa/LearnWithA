"use client";

export default function Error({ reset }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-accent">Portal de clase</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo.
        </p>
        <button
          className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          type="button"
          onClick={() => reset()}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
