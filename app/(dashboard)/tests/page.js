import TestsDashboard from "@/components/TestsDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function TestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: tests }] = await Promise.all([
    supabase.from("usuarios").select("rol").eq("id", user.id).single(),
    supabase.from("tests").select("*").order("creado_en", { ascending: false }),
  ]);

  const esAdmin = perfil?.rol === "admin";
  let resultados = [];

  if (esAdmin) {
    const { data } = await supabase
      .from("estudiantes_progreso")
      .select(
        "id, puntuacion, completado_en, usuarios(nombre), tests(titulo, preguntas)",
      )
      .order("completado_en", { ascending: false });
    resultados = data ?? [];
  }

  return (
    <TestsDashboard
      tests={tests ?? []}
      esAdmin={esAdmin}
      estudianteId={user.id}
      resultados={resultados}
    />
  );
}
