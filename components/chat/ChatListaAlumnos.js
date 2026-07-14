import EmptyState from "@/components/ui/EmptyState";
import Avatar from "../Avatar";

export default function ChatListaAlumnos({
  conversaciones,
  estudianteSeleccionado,
  onAbrirConversacion,
  sinAlumnos,
}) {
  return (
    <aside className="flex min-h-0 w-full shrink-0 resize-none flex-col border-b border-slate-200 lg:w-[280px] lg:border-b-0 lg:border-r">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-900">Alumnos</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {conversaciones.map((estudiante) => (
          <button
            key={estudiante.id}
            className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
              estudianteSeleccionado === estudiante.id ? "bg-accent-muted" : ""
            }`}
            type="button"
            onClick={() => onAbrirConversacion(estudiante.id)}
          >
            <Avatar nombre={estudiante.nombre} url={estudiante.avatar_url} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900">
                {estudiante.nombre}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {estudiante.ultimo?.contenido ??
                  (estudiante.ultimo?.adjuntos?.length
                    ? "📎 Archivo adjunto"
                    : "Sin mensajes")}
              </span>
            </span>
            {estudiante.noLeidos > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                {estudiante.noLeidos}
              </span>
            )}
          </button>
        ))}
        {sinAlumnos && (
          <EmptyState className="m-4 border-0 bg-transparent p-6 shadow-none">
            Todavía no hay alumnos.
          </EmptyState>
        )}
      </div>
    </aside>
  );
}
