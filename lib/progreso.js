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

export function contarActividad(alumno) {
  const partidasMemoria = (alumno.memoria ?? []).reduce(
    (suma, juego) => suma + (juego.partidas ?? 0),
    0,
  );
  return {
    tests: alumno.tests?.length ?? 0,
    lecciones: alumno.lecciones?.length ?? 0,
    partidasMemoria,
    total:
      (alumno.tests?.length ?? 0) +
      (alumno.lecciones?.length ?? 0) +
      partidasMemoria,
  };
}

export function fechaUltimaActividad(alumno) {
  const fechas = [
    ...(alumno.tests ?? []).map((item) => item.completado_en),
    ...(alumno.lecciones ?? []).map((item) => item.completado_en),
    ...(alumno.memoria ?? []).map((item) => item.ultimaFecha),
  ].filter(Boolean);

  if (fechas.length === 0) return null;

  return fechas.reduce((ultima, fecha) =>
    new Date(fecha) > new Date(ultima) ? fecha : ultima,
  );
}

// Ordena en memoria para el panel admin (búsqueda/filtro en el cliente).
export function filtrarYOrdenarAlumnos(alumnos, { busqueda, nivel, orden }) {
  const texto = (busqueda ?? "").trim().toLowerCase();

  let lista = alumnos.filter((alumno) => {
    if (nivel && nivel !== "todos" && (alumno.nivel ?? "A1") !== nivel) {
      return false;
    }
    if (!texto) return true;
    return (alumno.nombre ?? "").toLowerCase().includes(texto);
  });

  lista = [...lista].sort((a, b) => {
    if (orden === "actividad") {
      return contarActividad(b).total - contarActividad(a).total;
    }
    if (orden === "inactivos") {
      const diff = contarActividad(a).total - contarActividad(b).total;
      if (diff !== 0) return diff;
    }
    if (orden === "reciente") {
      const fechaA = fechaUltimaActividad(a);
      const fechaB = fechaUltimaActividad(b);
      if (!fechaA && !fechaB) return a.nombre.localeCompare(b.nombre, "es");
      if (!fechaA) return 1;
      if (!fechaB) return -1;
      return new Date(fechaB) - new Date(fechaA);
    }
    return (a.nombre ?? "").localeCompare(b.nombre ?? "", "es");
  });

  return lista;
}
