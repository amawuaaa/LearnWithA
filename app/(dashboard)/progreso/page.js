import ProgresoDashboard from "@/components/ProgresoDashboard";
import { getPerfilActual } from "@/lib/auth";
import { agruparProgresoPorAlumno } from "@/lib/progreso";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProgresoPage() {
  const { perfil } = await getPerfilActual();
  if (perfil.rol !== "admin") redirect("/");

  const supabase = await createClient();
  const [estudiantesResult, testsResult, leccionesResult, memoriaResult] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nombre, nivel")
        .eq("rol", "estudiante")
        .order("nombre"),
      supabase
        .from("estudiantes_progreso")
        .select(
          "estudiante_id, puntuacion, intentos, completado_en, tests(titulo, preguntas)",
        )
        .order("completado_en", { ascending: false }),
      supabase
        .from("lecciones_vocabulario_progreso")
        .select(
          "estudiante_id, puntuacion, total, intentos, completado_en, lecciones_vocabulario(titulo)",
        )
        .order("completado_en", { ascending: false }),
      supabase
        .from("memoria_resultados")
        .select(
          "estudiante_id, juego_id, intentos, completado_en, juegos_memoria(titulo)",
        ),
    ]);

  // Aplana los joins y calcula el total de preguntas en el servidor para no
  // enviar nunca las preguntas (con respuesta_correcta) al navegador.
  const alumnos = agruparProgresoPorAlumno({
    estudiantes: estudiantesResult.data ?? [],
    tests: (testsResult.data ?? []).map((resultado) => ({
      estudiante_id: resultado.estudiante_id,
      titulo: resultado.tests?.titulo ?? "Test eliminado",
      puntuacion: resultado.puntuacion,
      total: resultado.tests?.preguntas?.length ?? null,
      intentos: resultado.intentos,
      completado_en: resultado.completado_en,
    })),
    lecciones: (leccionesResult.data ?? []).map((resultado) => ({
      estudiante_id: resultado.estudiante_id,
      titulo: resultado.lecciones_vocabulario?.titulo ?? "Lección eliminada",
      puntuacion: resultado.puntuacion,
      total: resultado.total,
      intentos: resultado.intentos,
      completado_en: resultado.completado_en,
    })),
    memoria: (memoriaResult.data ?? []).map((partida) => ({
      estudiante_id: partida.estudiante_id,
      juego_id: partida.juego_id,
      titulo: partida.juegos_memoria?.titulo ?? "Juego eliminado",
      intentos: partida.intentos,
      completado_en: partida.completado_en,
    })),
  });

  return <ProgresoDashboard alumnos={alumnos} />;
}
