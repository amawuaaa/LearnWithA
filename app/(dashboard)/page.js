import HomeDashboard from "@/components/HomeDashboard";
import { formatearHora, proximaClase } from "@/lib/horario";
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

  const anunciosPromise = supabase
    .from("anuncios")
    .select("*, usuarios(nombre)")
    .order("creado_en", { ascending: false })
    .limit(3);

  const [{ data: horario }, { data: canceladas }] = await Promise.all([
    supabase
      .from("horario_clases")
      .select("dia_semana, hora")
      .order("hora", { ascending: true }),
    supabase.from("clases_canceladas").select("fecha"),
  ]);

  const proxima = proximaClase({
    diasSemana: new Set((horario ?? []).map((h) => h.dia_semana)),
    canceladas: new Set((canceladas ?? []).map((c) => c.fecha)),
  });

  const horasProxima = proxima
    ? (horario ?? [])
        .filter((slot) => slot.dia_semana === proxima.fecha.getDay())
        .map((slot) => formatearHora(slot.hora))
    : [];

  const proximaClaseInfo = proxima
    ? {
        diasRestantes: proxima.diasRestantes,
        fechaLabel: proxima.fecha.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        horas: horasProxima,
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
