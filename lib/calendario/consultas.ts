import { rangoGrillaMes } from "@/lib/horario";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SELECT_CLASES =
  "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)";

interface ConId {
  id: string;
  fecha: string;
  hora?: string;
}

function compararClases(a: ConId & { hora: string }, b: ConId & { hora: string }) {
  return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora);
}

function compararEventos(a: ConId, b: ConId) {
  return a.fecha.localeCompare(b.fecha);
}

export function fusionarPorId<T extends ConId>(
  actuales: T[],
  nuevos: T[],
  comparar?: (a: T, b: T) => number,
) {
  const mapa = new Map(actuales.map((item) => [item.id, item]));

  for (const item of nuevos) {
    mapa.set(item.id, item);
  }

  const resultado = [...mapa.values()];
  return comparar ? resultado.sort(comparar) : resultado;
}

export async function cargarDatosCalendario(
  supabase: SupabaseClient,
  anio: number,
  mes: number,
  { esAdmin, usuarioId }: { esAdmin: boolean; usuarioId: string },
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

export function fusionarClases<T extends ConId & { hora: string }>(
  actuales: T[],
  nuevas: T[],
) {
  return fusionarPorId(actuales, nuevas, compararClases);
}

export function fusionarEventos<T extends ConId>(actuales: T[], nuevos: T[]) {
  return fusionarPorId(actuales, nuevos, compararEventos);
}
