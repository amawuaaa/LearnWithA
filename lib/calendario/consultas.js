import { rangoGrillaMes } from "@/lib/horario";

export const SELECT_CLASES =
  "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)";

function compararClases(a, b) {
  return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora);
}

function compararEventos(a, b) {
  return a.fecha.localeCompare(b.fecha);
}

export function fusionarPorId(actuales, nuevos, comparar) {
  const mapa = new Map(actuales.map((item) => [item.id, item]));

  for (const item of nuevos) {
    mapa.set(item.id, item);
  }

  const resultado = [...mapa.values()];
  return comparar ? resultado.sort(comparar) : resultado;
}

export async function cargarDatosCalendario(
  supabase,
  anio,
  mes,
  { esAdmin, usuarioId },
) {
  const { desde, hasta } = rangoGrillaMes(anio, mes);

  let consultaClases = supabase
    .from("clases_estudiante")
    .select(SELECT_CLASES)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (!esAdmin) {
    consultaClases = consultaClases.eq("estudiante_id", usuarioId);
  }

  const [clasesResult, eventosResult] = await Promise.all([
    consultaClases,
    supabase
      .from("eventos_calendario")
      .select("*")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha", { ascending: true }),
  ]);

  return {
    clases: clasesResult.data ?? [],
    eventos: eventosResult.data ?? [],
    error: clasesResult.error ?? eventosResult.error,
  };
}

export function fusionarClases(actuales, nuevas) {
  return fusionarPorId(actuales, nuevas, compararClases);
}

export function fusionarEventos(actuales, nuevos) {
  return fusionarPorId(actuales, nuevos, compararEventos);
}
