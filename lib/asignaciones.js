/** Agrupa IDs de alumnos por test_id o leccion_id. */
export function agruparAsignacionesPorContenido(asignaciones, campoId) {
  const mapa = new Map();
  for (const fila of asignaciones ?? []) {
    const contenidoId = fila[campoId];
    if (!contenidoId) continue;
    const lista = mapa.get(contenidoId) ?? [];
    lista.push(fila.estudiante_id);
    mapa.set(contenidoId, lista);
  }
  return mapa;
}
