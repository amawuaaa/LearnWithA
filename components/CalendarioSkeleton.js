export default function CalendarioSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-44 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="h-9 w-9 rounded-lg bg-slate-200" />
          <div className="h-6 w-36 rounded bg-slate-200" />
          <div className="h-9 w-9 rounded-lg bg-slate-200" />
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, indice) => (
            <div
              key={`cabecera-${indice}`}
              className="mx-auto h-3 w-6 rounded bg-slate-200"
            />
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, indice) => (
            <div
              key={`dia-${indice}`}
              className="aspect-square rounded-lg bg-slate-100"
            />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-4/5 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
