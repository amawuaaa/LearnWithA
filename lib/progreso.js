// Agrupa los resultados de tests, vocabulario y memoria por alumno para el
// panel de progreso de la profesora. Las partidas de memoria se resumen por
// juego (mejor resultado y número de partidas); tests y lecciones se listan
// tal cual llegan.
export function agruparProgresoPorAlumno({
  estudiantes,
  tests,
  lecciones,
  memoria,
}) {
  const porAlumno = new Map(
    estudiantes.map((estudiante) => [
      estudiante.id,
      { ...estudiante, tests: [], lecciones: [], memoria: new Map() },
    ]),
  );

  for (const resultado of tests) {
    porAlumno.get(resultado.estudiante_id)?.tests.push(resultado);
  }

  for (const resultado of lecciones) {
    porAlumno.get(resultado.estudiante_id)?.lecciones.push(resultado);
  }

  for (const partida of memoria) {
    const alumno = porAlumno.get(partida.estudiante_id);
    if (!alumno) continue;

    const resumen = alumno.memoria.get(partida.juego_id) ?? {
      titulo: partida.titulo,
      partidas: 0,
      mejorIntentos: null,
      ultimaFecha: null,
    };

    resumen.partidas += 1;
    if (resumen.mejorIntentos === null || partida.intentos < resumen.mejorIntentos) {
      resumen.mejorIntentos = partida.intentos;
    }
    if (
      resumen.ultimaFecha === null ||
      new Date(partida.completado_en) > new Date(resumen.ultimaFecha)
    ) {
      resumen.ultimaFecha = partida.completado_en;
    }

    alumno.memoria.set(partida.juego_id, resumen);
  }

  return [...porAlumno.values()].map((alumno) => ({
    ...alumno,
    memoria: [...alumno.memoria.values()],
  }));
}
