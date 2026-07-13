import ChatDashboard from "@/components/ChatDashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, avatar_url, rol")
    .eq("id", user.id)
    .single();
  const esAdmin = perfil?.rol === "admin";
  let estudiantes = [];

  if (esAdmin) {
    const { data: conversaciones } = await supabase.rpc(
      "listar_conversaciones_chat",
    );
    estudiantes = (conversaciones ?? []).map((conversacion) => ({
      id: conversacion.estudiante_id,
      nombre: conversacion.nombre,
      avatar_url: conversacion.avatar_url,
      ultimo: conversacion.ultimo_creado_en
        ? {
            contenido: conversacion.ultimo_contenido,
            creado_en: conversacion.ultimo_creado_en,
          }
        : null,
      noLeidos: Number(conversacion.no_leidos ?? 0),
    }));
  }

  const conversacionInicial = esAdmin ? estudiantes[0]?.id : user.id;
  let mensajes = [];
  let hayMasMensajes = false;

  if (conversacionInicial) {
    const { data } = await supabase
      .from("mensajes")
      .select(
        "*, remitente:usuarios!mensajes_remitente_id_fkey(nombre, avatar_url, rol)",
      )
      .eq("estudiante_id", conversacionInicial)
      .order("creado_en", { ascending: false })
      .order("id", { ascending: false })
      .limit(51);
    hayMasMensajes = (data?.length ?? 0) > 50;
    mensajes = (data ?? []).slice(0, 50).reverse();
  }

  return (
    <ChatDashboard
      esAdmin={esAdmin}
      usuario={{
        id: user.id,
        nombre: perfil?.nombre ?? user.email?.split("@")[0] ?? "Usuario",
        avatar_url: perfil?.avatar_url ?? null,
      }}
      estudiantes={estudiantes}
      initialMessages={mensajes}
      initialHasMore={hayMasMensajes}
    />
  );
}
