"use client";

import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import useChatDashboard from "@/lib/hooks/useChatDashboard";
import ConfirmDialog from "./ConfirmDialog";
import ChatListaAlumnos from "./chat/ChatListaAlumnos";
import ChatPanelConversacion from "./chat/ChatPanelConversacion";

export default function ChatDashboard(props) {
  const chat = useChatDashboard(props);

  return (
    <div className="-mb-6 flex h-[calc(100dvh-6rem)] flex-col md:-mb-2 md:h-[calc(100dvh-4.5rem)]">
      {chat.esAdmin && (
        <div
          className={`mb-4 shrink-0 ${chat.vistaMovil === "chat" ? "hidden lg:block" : ""}`}
        >
          <PageHeader
            etiqueta="Comunicación privada"
            titulo="Mensajes"
            descripcion="Responde de forma privada a las dudas de tus alumnos."
            className="mb-0"
          />
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
          chat.esAdmin ? "lg:grid lg:grid-cols-[280px_minmax(0,1fr)]" : ""
        }`}
      >
        {chat.esAdmin && (
          <div className={chat.mostrarListaMovil ? "flex" : "hidden lg:flex"}>
            <ChatListaAlumnos
              conversaciones={chat.conversaciones}
              estudianteSeleccionado={chat.estudianteSeleccionado}
              onAbrirConversacion={chat.abrirConversacion}
              sinAlumnos={chat.estudiantes.length === 0}
            />
          </div>
        )}

        <section
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            chat.esAdmin && !chat.mostrarChatMovil ? "hidden lg:flex" : "flex"
          }`}
        >
          {chat.estudianteSeleccionado ? (
            <ChatPanelConversacion
              esAdmin={chat.esAdmin}
              estudianteActivo={chat.estudianteActivo}
              mensajesVisibles={chat.mensajesVisibles}
              hayMasMensajes={chat.hayMasMensajes}
              cargandoConversacion={chat.cargandoConversacion}
              cargandoAnteriores={chat.cargandoAnteriores}
              editando={chat.editando}
              textoEdicion={chat.textoEdicion}
              errorEdicion={chat.errorEdicion}
              guardandoEdicion={chat.guardandoEdicion}
              contenido={chat.contenido}
              archivos={chat.archivos}
              enviando={chat.enviando}
              error={chat.error}
              usuario={chat.usuario}
              finalRef={chat.finalRef}
              archivoInputRef={chat.archivoInputRef}
              onVolverLista={() => chat.setVistaMovil("lista")}
              onCargarAnteriores={chat.cargarMensajesAnteriores}
              onCambiarTextoEdicion={chat.setTextoEdicion}
              onCancelarEdicion={() => chat.setEditando(null)}
              onGuardarEdicion={chat.guardarEdicion}
              onIniciarEdicion={chat.iniciarEdicion}
              onSolicitarEliminar={(mensaje) => {
                chat.setBorrando(mensaje);
                chat.setErrorEliminar("");
              }}
              onCambiarContenido={chat.setContenido}
              onSeleccionarArchivos={chat.seleccionarArchivos}
              onQuitarArchivo={(indice) =>
                chat.setArchivos((actuales) =>
                  actuales.filter((_, archivoIndice) => archivoIndice !== indice),
                )
              }
              onEnviar={chat.enviarMensaje}
            />
          ) : (
            <EmptyState className="m-4 flex min-h-0 flex-1 items-center justify-center border-0 bg-transparent shadow-none">
              Selecciona un alumno para abrir la conversación.
            </EmptyState>
          )}
        </section>
      </div>

      <ConfirmDialog
        abierto={chat.borrando !== null}
        titulo="Eliminar mensaje"
        mensaje="¿Quieres eliminar este mensaje? Esta acción no se puede deshacer."
        cargando={chat.eliminando}
        error={chat.errorEliminar}
        onConfirm={chat.eliminarMensaje}
        onCancel={() => {
          if (chat.eliminando) return;
          chat.setBorrando(null);
          chat.setErrorEliminar("");
        }}
      />
    </div>
  );
}
