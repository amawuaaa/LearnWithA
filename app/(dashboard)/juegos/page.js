import ContentDashboard from "@/components/ContentDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function JuegosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: contenidos }] = await Promise.all([
    supabase.from("usuarios").select("rol").eq("id", user.id).single(),
    supabase
      .from("contenido_didactico")
      .select("*")
      .eq("tipo", "juego")
      .order("creado_en", { ascending: false }),
  ]);

  return (
    <ContentDashboard
      contenidos={contenidos ?? []}
      tipoPagina="juego"
      esAdmin={perfil?.rol === "admin"}
    />
  );
}
