export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-36 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 max-w-full rounded bg-slate-200" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-20 w-20 shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full max-w-sm rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="h-20 rounded-lg bg-slate-100" />
          <div className="h-20 rounded-lg bg-slate-100" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="h-5 w-32 rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div
              key={indice}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-6 w-20 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
