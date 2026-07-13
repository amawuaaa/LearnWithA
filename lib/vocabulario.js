export function limpiarPalabras(palabras) {
  return palabras.map((palabra) => ({
    termino: palabra.termino.trim(),
    significado: palabra.significado.trim(),
    pronunciacion: palabra.pronunciacion.trim(),
    ejemplo: palabra.ejemplo.trim(),
  }));
}

export function palabrasValidas(palabras) {
  if (palabras.length < 4 || palabras.length > 20) return false;

  const terminos = palabras.map((palabra) => palabra.termino.toLowerCase());
  const significados = palabras.map((palabra) =>
    palabra.significado.toLowerCase(),
  );

  return (
    palabras.every(
      (palabra) =>
        palabra.termino &&
        palabra.significado &&
        palabra.pronunciacion &&
        palabra.ejemplo,
    ) &&
    new Set(terminos).size === terminos.length &&
    new Set(significados).size === significados.length
  );
}

export function generarEjerciciosVocabulario(palabras) {
  return palabras.map((palabra, indice) => {
    const distractores = [];

    for (let desplazamiento = 1; distractores.length < 3; desplazamiento += 1) {
      const candidata =
        palabras[(indice + desplazamiento) % palabras.length].significado;
      if (
        candidata !== palabra.significado &&
        !distractores.includes(candidata)
      ) {
        distractores.push(candidata);
      }
    }

    const opciones = [palabra.significado, ...distractores];
    const giro = indice % opciones.length;

    return {
      tipo: "opcion_multiple",
      pregunta: `¿Qué significa “${palabra.termino}”?`,
      opciones: [...opciones.slice(giro), ...opciones.slice(0, giro)],
      respuesta_correcta: palabra.significado,
    };
  });
}
