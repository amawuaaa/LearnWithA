import AnnouncementFeed from "@/components/AnnouncementFeed";
import { createClient } from "@/lib/supabase/server";

export default async function NoticiasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: anuncios }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("nombre, rol")
      .eq("id", user.id)
      .single(),
    supabase
      .from("anuncios")
      .select("*, usuarios(nombre)")
      .order("creado_en", { ascending: false }),
  ]);

  return (
    <AnnouncementFeed
      initialAnnouncements={anuncios ?? []}
      esAdmin={perfil?.rol === "admin"}
      usuario={{
        id: user.id,
        nombre: perfil?.nombre ?? "Profesora",
      }}
    />
  );
}
