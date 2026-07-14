function LineaAlumno() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 p-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded bg-slate-200" />
        <div className="h-3 w-40 max-w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}

function Burbuja({ alineacion }) {
  return (
    <div className={`flex ${alineacion === "derecha" ? "justify-end" : "justify-start"}`}>
      <div
        className={`h-16 rounded-2xl bg-slate-200 ${
          alineacion === "derecha" ? "w-48 rounded-br-md" : "w-56 rounded-bl-md"
        }`}
      />
    </div>
  );
}

export default function ChatSkeleton() {
  return (
    <div className="-mb-6 flex h-[calc(100dvh-6rem)] animate-pulse flex-col md:-mb-2 md:h-[calc(100dvh-4.5rem)]">
      <div className="mb-4 shrink-0">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-40 rounded bg-slate-200" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col border-b border-slate-200 lg:flex lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3">
            <div className="h-5 w-20 rounded bg-slate-200" />
          </div>
          <LineaAlumno />
          <LineaAlumno />
          <LineaAlumno />
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-200" />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 bg-slate-50/60 p-4 sm:p-5">
            <Burbuja alineacion="izquierda" />
            <Burbuja alineacion="derecha" />
            <Burbuja alineacion="izquierda" />
            <Burbuja alineacion="derecha" />
          </div>

          <div className="shrink-0 border-t border-slate-200 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 flex-1 rounded-lg bg-slate-200" />
              <div className="h-12 w-12 rounded-lg bg-slate-200" />
              <div className="h-12 w-20 rounded-lg bg-slate-200" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
