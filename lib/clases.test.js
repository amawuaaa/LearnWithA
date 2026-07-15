import { describe, expect, it } from "vitest";
import {
  mensajeErrorGeneracionClases,
  mensajeExitoGeneracionClases,
  normalizarResultadoGeneracion,
} from "./clases.js";

describe("normalizarResultadoGeneracion", () => {
  it("devuelve null si no hay datos", () => {
    expect(normalizarResultadoGeneracion(null)).toBeNull();
  });

  it("toma el primer elemento de un array", () => {
    expect(
      normalizarResultadoGeneracion([{ creadas: 3, omitidas: 1 }]),
    ).toEqual({ creadas: 3, omitidas: 1 });
  });
});

describe("mensajeExitoGeneracionClases", () => {
  it("resume creadas, omitidas y alumnos sin plantilla", () => {
    expect(
      mensajeExitoGeneracionClases({
        creadas: 4,
        omitidas: 2,
        sinPlantilla: 1,
      }),
    ).toContain("4 clases nuevas");
    expect(
      mensajeExitoGeneracionClases({
        creadas: 4,
        omitidas: 2,
        sinPlantilla: 1,
      }),
    ).toContain("1 alumno no tiene patrón semanal");
  });
});

describe("mensajeErrorGeneracionClases", () => {
  it("traduce falta de permisos", () => {
    expect(
      mensajeErrorGeneracionClases({ code: "42501", message: "rls" }),
    ).toContain("permisos");
  });

  it("indica migración pendiente", () => {
    expect(
      mensajeErrorGeneracionClases({ code: "42883", message: "" }),
    ).toContain("migración 028");
  });
});
