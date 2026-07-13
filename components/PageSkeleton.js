export default function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-56 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((indice) => (
          <div
            key={indice}
            className="h-32 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-16 rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
