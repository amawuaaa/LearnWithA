import TestsDashboard from "@/components/TestsDashboard";
import { getPerfilActual } from "@/lib/auth";
import { agruparAsignacionesPorContenido } from "@/lib/asignaciones";
import { createClient } from "@/lib/supabase/server";

export default async function TestsPage() {
  const { perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";

  // El admin necesita respuesta_correcta para editar; los alumnos leen la
  // vista tests_alumno, que no expone las respuestas correctas.
  const consultas = [
    esAdmin
      ? supabase
          .from("tests")
          .select("*")
          .order("creado_en", { ascending: false })
      : supabase
          .from("tests_alumno")
          .select("*")
          .order("creado_en", { ascending: false }),
  ];

  if (esAdmin) {
    consultas.push(
      supabase
        .from("estudiantes_progreso")
        .select(
          "id, puntuacion, intentos, completado_en, usuarios(nombre), tests(titulo, preguntas)",
        )
        .order("completado_en", { ascending: false }),
      supabase
        .from("usuarios")
        .select("id, nombre, nivel")
        .eq("rol", "estudiante")
        .order("nombre"),
      supabase
        .from("asignaciones_contenido")
        .select("test_id, estudiante_id")
        .eq("tipo", "test"),
    );
  }

  const [testsResult, resultadosResult, estudiantesResult, asignacionesResult] =
    await Promise.all(consultas);

  return (
    <TestsDashboard
      tests={testsResult.data ?? []}
      esAdmin={esAdmin}
      nivelUsuario={perfil.nivel}
      resultados={resultadosResult?.data ?? []}
      estudiantes={estudiantesResult?.data ?? []}
      asignacionesPorTest={Object.fromEntries(
        agruparAsignacionesPorContenido(
          asignacionesResult?.data ?? [],
          "test_id",
        ),
      )}
    />
  );
}
