import VocabularyDashboard from "@/components/VocabularyDashboard";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VocabularioPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";
  const consultas = [
    supabase
      .from(
        esAdmin
          ? "lecciones_vocabulario"
          : "lecciones_vocabulario_alumno",
      )
      .select("*")
      .order("creado_en", { ascending: false }),
    supabase
      .from(esAdmin ? "contenido_didactico" : "contenido_didactico_alumno")
      .select("*")
      .in("tipo", ["vocabulario", "verbo"])
      .order("creado_en", { ascending: false }),
  ];

  if (!esAdmin) {
    consultas.push(
      supabase
        .from("lecciones_vocabulario_progreso")
        .select("leccion_id, puntuacion, total, intentos, completado_en")
        .eq("estudiante_id", user.id),
    );
  }

  const [leccionesResult, contenidosResult, progresosResult] =
    await Promise.all(consultas);

  return (
    <VocabularyDashboard
      lecciones={leccionesResult.data ?? []}
      contenidos={contenidosResult.data ?? []}
      progresos={progresosResult?.data ?? []}
      esAdmin={esAdmin}
      nivelUsuario={perfil.nivel}
    />
  );
}
