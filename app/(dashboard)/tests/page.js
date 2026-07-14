import TestsDashboard from "@/components/TestsDashboard";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TestsPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";

  // El admin necesita respuesta_correcta para editar; los alumnos leen la
  // vista tests_alumno, que no expone las respuestas correctas.
  const { data: tests } = esAdmin
    ? await supabase
        .from("tests")
        .select("*")
        .order("creado_en", { ascending: false })
    : await supabase
        .from("tests_alumno")
        .select("*")
        .order("creado_en", { ascending: false });

  let resultados = [];

  if (esAdmin) {
    const { data } = await supabase
      .from("estudiantes_progreso")
      .select(
        "id, puntuacion, intentos, completado_en, usuarios(nombre), tests(titulo, preguntas)",
      )
      .order("completado_en", { ascending: false });
    resultados = data ?? [];
  }

  return (
    <TestsDashboard
      tests={tests ?? []}
      esAdmin={esAdmin}
      nivelUsuario={perfil.nivel}
      resultados={resultados}
    />
  );
}
