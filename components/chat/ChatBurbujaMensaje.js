import { Textarea } from "@/components/ui/Input";
import ChatAttachment from "../ChatAttachment";

export default function ChatBurbujaMensaje({
  mensaje,
  propio,
  editando,
  textoEdicion,
  errorEdicion,
  guardandoEdicion,
  onCambiarTextoEdicion,
  onCancelarEdicion,
  onGuardarEdicion,
  onIniciarEdicion,
  onSolicitarEliminar,
}) {
  return (
    <div className={`flex ${propio ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[70%] ${
          propio
            ? "rounded-br-md bg-accent text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
        }`}
      >
        {editando ? (
          <div>
            <Textarea
              className="h-24 min-w-0 max-w-full border-teal-200 bg-white text-base text-slate-800 sm:text-sm"
              value={textoEdicion}
              onChange={(event) => onCambiarTextoEdicion(event.target.value)}
              maxLength={2000}
              autoFocus
            />
            {errorEdicion && (
              <p className="mt-1 text-xs text-red-100">{errorEdicion}</p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button
                className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
                type="button"
                disabled={guardandoEdicion}
                onClick={onCancelarEdicion}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted disabled:opacity-60"
                type="button"
                disabled={guardandoEdicion}
                onClick={() => onGuardarEdicion(mensaje)}
              >
                {guardandoEdicion ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        ) : mensaje.contenido ? (
          <p className="whitespace-pre-wrap break-words leading-6">
            {mensaje.contenido}
          </p>
        ) : null}
        {mensaje.adjuntos?.length > 0 && (
          <div className={`space-y-2 ${mensaje.contenido ? "mt-3" : ""}`}>
            {mensaje.adjuntos.map((adjunto) => (
              <ChatAttachment
                key={adjunto.path}
                adjunto={adjunto}
                propio={propio}
              />
            ))}
          </div>
        )}
        <p
          className={`mt-1 text-[11px] ${
            propio ? "text-teal-100" : "text-slate-400"
          }`}
          suppressHydrationWarning
        >
          {new Date(mensaje.creado_en).toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
          })}
          {mensaje.editado_en ? " · Editado" : ""}
          {propio && mensaje.leido_en ? " · Leído" : ""}
        </p>
        {propio && !editando && (
          <div className="mt-1 flex justify-end gap-3 text-[11px] text-teal-100">
            <button
              className="hover:text-white hover:underline"
              type="button"
              onClick={() => onIniciarEdicion(mensaje)}
            >
              Editar
            </button>
            <button
              className="hover:text-white hover:underline"
              type="button"
              onClick={() => onSolicitarEliminar(mensaje)}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
