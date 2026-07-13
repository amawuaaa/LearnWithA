"use client";

export default function Error({ reset }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h1 className="text-lg font-semibold text-slate-900">
        Algo salió mal en esta página
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
  );
}
