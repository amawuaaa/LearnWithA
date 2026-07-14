import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "../Avatar";
import { IconVolver } from "../icons";
import ChatBurbujaMensaje from "./ChatBurbujaMensaje";
import ChatFormularioEnvio from "./ChatFormularioEnvio";

export default function ChatPanelConversacion({
  esAdmin,
  estudianteActivo,
  mensajesVisibles,
  hayMasMensajes,
  cargandoConversacion,
  cargandoAnteriores,
  editando,
  textoEdicion,
  errorEdicion,
  guardandoEdicion,
  contenido,
  archivos,
  enviando,
  error,
  usuario,
  finalRef,
  archivoInputRef,
  onVolverLista,
  onCargarAnteriores,
  onCambiarTextoEdicion,
  onCancelarEdicion,
  onGuardarEdicion,
  onIniciarEdicion,
  onSolicitarEliminar,
  onCambiarContenido,
  onSeleccionarArchivos,
  onQuitarArchivo,
  onEnviar,
}) {
  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3">
        {esAdmin && (
          <Button
            compact
            className="flex h-9 w-9 shrink-0 items-center justify-center lg:hidden"
            variante="secondary"
            type="button"
            aria-label="Volver a la lista de alumnos"
            onClick={onVolverLista}
          >
            <IconVolver />
          </Button>
        )}
        {esAdmin && (
          <Avatar
            nombre={estudianteActivo?.nombre}
            url={estudianteActivo?.avatar_url}
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-slate-900">
            {esAdmin
              ? estudianteActivo?.nombre
              : "Conversación con la profesora"}
          </h2>
          <p className="text-xs text-slate-500">
            La respuesta puede no ser inmediata.
          </p>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-slate-50/60 p-4 sm:p-5"
        aria-live="polite"
      >
        {hayMasMensajes && !cargandoConversacion && (
          <div className="text-center">
            <Button
              variante="secondary"
              className="px-4 py-2 text-xs"
              type="button"
              disabled={cargandoAnteriores}
              onClick={onCargarAnteriores}
            >
              {cargandoAnteriores
                ? "Cargando…"
                : "Cargar mensajes anteriores"}
            </Button>
          </div>
        )}
        {cargandoConversacion && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Cargando conversación…
          </div>
        )}
        {mensajesVisibles.map((mensaje) => (
          <ChatBurbujaMensaje
            key={mensaje.id}
            mensaje={mensaje}
            propio={mensaje.remitente_id === usuario.id}
            editando={editando === mensaje.id}
            textoEdicion={textoEdicion}
            errorEdicion={errorEdicion}
            guardandoEdicion={guardandoEdicion}
            onCambiarTextoEdicion={onCambiarTextoEdicion}
            onCancelarEdicion={onCancelarEdicion}
            onGuardarEdicion={onGuardarEdicion}
            onIniciarEdicion={onIniciarEdicion}
            onSolicitarEliminar={onSolicitarEliminar}
          />
        ))}
        {!cargandoConversacion && mensajesVisibles.length === 0 && (
          <EmptyState className="flex h-full items-center justify-center border-0 bg-transparent shadow-none">
            {esAdmin
              ? "Todavía no hay mensajes. Puedes iniciar la conversación."
              : "Todavía no hay mensajes. Escribe tu primera duda."}
          </EmptyState>
        )}
        <div ref={finalRef} />
      </div>

      <ChatFormularioEnvio
        contenido={contenido}
        archivos={archivos}
        enviando={enviando}
        error={error}
        cargandoConversacion={cargandoConversacion}
        archivoInputRef={archivoInputRef}
        onCambiarContenido={onCambiarContenido}
        onSeleccionarArchivos={onSeleccionarArchivos}
        onQuitarArchivo={onQuitarArchivo}
        onEnviar={onEnviar}
      />
    </>
  );
}
