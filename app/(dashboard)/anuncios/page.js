import AnnouncementFeed from "@/components/AnnouncementFeed";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function NoticiasPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();

  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*, usuarios(nombre)")
    .order("creado_en", { ascending: false });

  return (
    <AnnouncementFeed
      initialAnnouncements={anuncios ?? []}
      esAdmin={perfil.rol === "admin"}
      usuario={{
        id: user.id,
        nombre: perfil.nombre,
      }}
    />
  );
}
