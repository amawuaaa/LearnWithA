import VocabularyDashboard from "@/components/VocabularyDashboard";
import { getPerfilActual } from "@/lib/auth";
import { agruparAsignacionesPorContenido } from "@/lib/asignaciones";
import { createClient } from "@/lib/supabase/server";

export default async function VocabularioPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";

  const leccionesPromise = supabase
    .from(
      esAdmin ? "lecciones_vocabulario" : "lecciones_vocabulario_alumno",
    )
    .select("*")
    .order("creado_en", { ascending: false });

  const contenidosPromise = supabase
    .from(esAdmin ? "contenido_didactico" : "contenido_didactico_alumno")
    .select("*")
    .in("tipo", ["vocabulario", "verbo"])
    .order("creado_en", { ascending: false });

  let progresos = [];
  let estudiantes = [];
  let asignacionesPorLeccion = {};

  if (esAdmin) {
    const [leccionesResult, contenidosResult, estudiantesResult, asignacionesResult] =
      await Promise.all([
        leccionesPromise,
        contenidosPromise,
        supabase
          .from("usuarios")
          .select("id, nombre, nivel")
          .eq("rol", "estudiante")
          .order("nombre"),
        supabase
          .from("asignaciones_contenido")
          .select("leccion_id, estudiante_id")
          .eq("tipo", "leccion_vocabulario"),
      ]);

    estudiantes = estudiantesResult.data ?? [];
    asignacionesPorLeccion = Object.fromEntries(
      agruparAsignacionesPorContenido(
        asignacionesResult.data ?? [],
        "leccion_id",
      ),
    );

    return (
      <VocabularyDashboard
        lecciones={leccionesResult.data ?? []}
        contenidos={contenidosResult.data ?? []}
        progresos={progresos}
        esAdmin={esAdmin}
        nivelUsuario={perfil.nivel}
        estudiantes={estudiantes}
        asignacionesPorLeccion={asignacionesPorLeccion}
      />
    );
  }

  const [leccionesResult, contenidosResult, progresosResult] =
    await Promise.all([
      leccionesPromise,
      contenidosPromise,
      supabase
        .from("lecciones_vocabulario_progreso")
        .select("leccion_id, puntuacion, total, intentos, completado_en")
        .eq("estudiante_id", user.id),
    ]);

  return (
    <VocabularyDashboard
      lecciones={leccionesResult.data ?? []}
      contenidos={contenidosResult.data ?? []}
      progresos={progresosResult.data ?? []}
      esAdmin={esAdmin}
      nivelUsuario={perfil.nivel}
      estudiantes={estudiantes}
      asignacionesPorLeccion={asignacionesPorLeccion}
    />
  );
}
