export default function CalendarioLeyenda() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded bg-accent-muted" /> Día con clase
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" />{" "}
        Solo cancelaciones
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-amber-500" /> Examen
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-sky-500" /> Aviso
      </span>
      <span className="text-slate-400">Pulsa un día para ver el detalle</span>
    </div>
  );
}
