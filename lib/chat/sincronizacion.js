import { SELECCION_MENSAJE } from "./constants";

// Suscribe el canal realtime de mensajes. Los alumnos solo escuchan su propia
// conversación; la profesora escucha todas. Devuelve la función de limpieza.
export function suscribirseAMensajes(
  supabase,
  { esAdmin, usuarioId, onMensaje, onEliminado },
) {
  async function sincronizar(payload) {
    if (payload.eventType === "DELETE") {
      onEliminado(payload.old.id);
      return;
    }

    // El payload realtime no incluye los joins: recupera el mensaje completo.
    const { data } = await supabase
      .from("mensajes")
      .select(SELECCION_MENSAJE)
      .eq("id", payload.new.id)
      .single();

    if (!data) return;
    onMensaje(data, payload.eventType);
  }

  const filtro = esAdmin
    ? { event: "*", schema: "public", table: "mensajes" }
    : {
        event: "*",
        schema: "public",
        table: "mensajes",
        filter: `estudiante_id=eq.${usuarioId}`,
      };
  const canal = supabase
    .channel(`chat-${usuarioId}`)
    .on("postgres_changes", filtro, sincronizar)
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
