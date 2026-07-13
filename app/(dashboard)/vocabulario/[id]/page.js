import VocabularyLessonPlayer from "@/components/VocabularyLessonPlayer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VocabularyLessonPage({ params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();
  const esAdmin = perfil?.rol === "admin";
  const { data: leccion } = await supabase
    .from(
      esAdmin
        ? "lecciones_vocabulario"
        : "lecciones_vocabulario_alumno",
    )
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!leccion || !leccion.palabras || !leccion.ejercicios) {
    notFound();
  }

  let progreso = null;
  if (!esAdmin) {
    const { data } = await supabase
      .from("lecciones_vocabulario_progreso")
      .select("puntuacion, total, intentos, completado_en")
      .eq("estudiante_id", user.id)
      .eq("leccion_id", leccion.id)
      .maybeSingle();
    progreso = data;
  }

  return (
    <VocabularyLessonPlayer
      leccion={leccion}
      esAdmin={esAdmin}
      progresoInicial={progreso}
    />
  );
}
