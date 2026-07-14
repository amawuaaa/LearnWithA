import { describe, expect, it } from "vitest";
import { agruparProgresoPorAlumno } from "./progreso";

const estudiantes = [
  { id: "ana", nombre: "Ana", nivel: "A2" },
  { id: "bea", nombre: "Bea", nivel: "A1" },
];

describe("agruparProgresoPorAlumno", () => {
  it("reparte tests y lecciones por alumno y deja vacíos los demás", () => {
    const alumnos = agruparProgresoPorAlumno({
      estudiantes,
      tests: [
        { estudiante_id: "ana", titulo: "Test 1", puntuacion: 4, total: 5 },
      ],
      lecciones: [
        { estudiante_id: "bea", titulo: "Ropa", puntuacion: 8, total: 10 },
      ],
      memoria: [],
    });

    const ana = alumnos.find((alumno) => alumno.id === "ana");
    const bea = alumnos.find((alumno) => alumno.id === "bea");
    expect(ana.tests).toHaveLength(1);
    expect(ana.lecciones).toHaveLength(0);
    expect(bea.tests).toHaveLength(0);
    expect(bea.lecciones[0].titulo).toBe("Ropa");
  });

  it("resume la memoria por juego con mejor intento, partidas y última fecha", () => {
    const alumnos = agruparProgresoPorAlumno({
      estudiantes,
      tests: [],
      lecciones: [],
      memoria: [
        {
          estudiante_id: "ana",
          juego_id: "j1",
          titulo: "Animales",
          intentos: 14,
          completado_en: "2026-07-01T10:00:00Z",
        },
        {
          estudiante_id: "ana",
          juego_id: "j1",
          titulo: "Animales",
          intentos: 9,
          completado_en: "2026-07-03T10:00:00Z",
        },
        {
          estudiante_id: "ana",
          juego_id: "j2",
          titulo: "Colores",
          intentos: 11,
          completado_en: "2026-07-02T10:00:00Z",
        },
      ],
    });

    const ana = alumnos.find((alumno) => alumno.id === "ana");
    expect(ana.memoria).toHaveLength(2);
    const animales = ana.memoria.find((juego) => juego.titulo === "Animales");
    expect(animales.partidas).toBe(2);
    expect(animales.mejorIntentos).toBe(9);
    expect(animales.ultimaFecha).toBe("2026-07-03T10:00:00Z");
  });

  it("ignora resultados de usuarios que ya no son estudiantes", () => {
    const alumnos = agruparProgresoPorAlumno({
      estudiantes,
      tests: [{ estudiante_id: "desconocido", titulo: "Test" }],
      lecciones: [],
      memoria: [
        {
          estudiante_id: "desconocido",
          juego_id: "j1",
          titulo: "Animales",
          intentos: 5,
          completado_en: "2026-07-01T10:00:00Z",
        },
      ],
    });

    expect(alumnos.every((alumno) => alumno.tests.length === 0)).toBe(true);
    expect(alumnos.every((alumno) => alumno.memoria.length === 0)).toBe(true);
  });
});
