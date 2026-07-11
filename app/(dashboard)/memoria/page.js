import MemoriaDashboard from "@/components/MemoriaDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function MemoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: juegos }] = await Promise.all([
    supabase.from("usuarios").select("rol").eq("id", user.id).single(),
    supabase
      .from("juegos_memoria")
      .select("*")
      .order("creado_en", { ascending: false }),
  ]);

  const esAdmin = perfil?.rol === "admin";
  let resultados = [];

  if (esAdmin) {
    const { data } = await supabase
      .from("memoria_resultados")
      .select(
        "id, intentos, completado_en, usuarios(nombre), juegos_memoria(titulo)",
      )
      .order("completado_en", { ascending: false });
    resultados = data ?? [];
  }

  return (
    <MemoriaDashboard
      juegos={juegos ?? []}
      esAdmin={esAdmin}
      estudianteId={user.id}
      resultados={resultados}
    />
  );
}
