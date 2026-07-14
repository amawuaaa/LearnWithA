import HomeDashboard from "@/components/HomeDashboard";
import {
  formatearFechaLocal,
  formatearHora,
  proximaClaseEstudiante,
} from "@/lib/horario";
import { createClient } from "@/lib/supabase/server";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, rol, nivel")
    .eq("id", user.id)
    .single();

  const esAdmin = perfil?.rol === "admin";
  const hoyStr = formatearFechaLocal(new Date());

  let consultaClases = supabase
    .from("clases_estudiante")
    .select(
      "fecha, hora, cancelada, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)",
    )
    .eq("cancelada", false)
    .gte("fecha", hoyStr)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (!esAdmin) {
    consultaClases = consultaClases.eq("estudiante_id", user.id);
  }

  const anunciosPromise = supabase
    .from("anuncios")
    .select("*, usuarios(nombre)")
    .order("creado_en", { ascending: false })
    .limit(3);

  const { data: clasesFuturas } = await consultaClases;
  const proxima = proximaClaseEstudiante(clasesFuturas ?? []);

  const proximaClaseInfo = proxima
    ? {
        diasRestantes: proxima.diasRestantes,
        fechaLabel: proxima.fecha.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        horas: proxima.clases.map((clase) =>
          esAdmin
            ? `${formatearHora(clase.hora)} · ${clase.estudiante?.nombre ?? "Alumno"}`
            : formatearHora(clase.hora),
        ),
      }
    : null;

  let anuncios;
  let estadisticas;

  if (esAdmin) {
    const [anunciosResult, estudiantesResult, testsResult, resultadosResult] =
      await Promise.all([
        anunciosPromise,
        supabase
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("rol", "estudiante"),
        supabase.from("tests").select("id", { count: "exact", head: true }),
        supabase
          .from("estudiantes_progreso")
          .select("id", { count: "exact", head: true }),
      ]);

    anuncios = anunciosResult.data ?? [];
    estadisticas = {
      estudiantes: estudiantesResult.count ?? 0,
      tests: testsResult.count ?? 0,
      resultados: resultadosResult.count ?? 0,
    };
  } else {
    const [anunciosResult, progresoResult, mensualidadResult] =
      await Promise.all([
        anunciosPromise,
        supabase
          .from("estudiantes_progreso")
          .select("id", { count: "exact", head: true })
          .eq("estudiante_id", user.id),
        supabase
          .from("mensualidades")
          .select("*")
          .eq("estudiante_id", user.id)
          .order("periodo", { ascending: false })
          .limit(1),
      ]);

    anuncios = anunciosResult.data ?? [];
    estadisticas = {
      testsCompletados: progresoResult.count ?? 0,
      mensualidad: mensualidadResult.data?.[0] ?? null,
      nivel: perfil?.nivel ?? "A1",
    };
  }

  return (
    <HomeDashboard
      nombre={perfil?.nombre ?? "Profesora"}
      esAdmin={esAdmin}
      anuncios={anuncios}
      estadisticas={estadisticas}
      proximaClase={proximaClaseInfo}
    />
  );
}
