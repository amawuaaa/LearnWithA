import MemoriaDashboard from "@/components/MemoriaDashboard";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MemoriaPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";

  // El admin necesita las parejas completas para editar; los alumnos leen
  // la vista juegos_memoria_alumno, que no revela qué carta hace pareja
  // con cuál.
  const { data: juegos } = esAdmin
    ? await supabase
        .from("juegos_memoria")
        .select("*")
        .order("creado_en", { ascending: false })
    : await supabase
        .from("juegos_memoria_alumno")
        .select("*")
        .order("creado_en", { ascending: false });
  let resultados = [];

  if (esAdmin) {
    const { data } = await supabase
      .from("memoria_resultados")
      .select(
        "id, juego_id, intentos, duracion_segundos, completado_en, usuarios(nombre), juegos_memoria(titulo)",
      )
      .order("completado_en", { ascending: false });
    resultados = data ?? [];
  } else {
    const { data } = await supabase
      .from("memoria_resultados")
      .select(
        "id, juego_id, intentos, duracion_segundos, completado_en",
      )
      .eq("estudiante_id", user.id)
      .order("intentos", { ascending: true })
      .order("duracion_segundos", { ascending: true });
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
