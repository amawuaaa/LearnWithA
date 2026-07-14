import { describe, expect, it } from "vitest";
import {
  formatearFechaLocal,
  proximaClase,
  proximaClaseEstudiante,
} from "./horario";

const LUNES = new Date(2026, 6, 13);

describe("proximaClase", () => {
  it("devuelve null si no hay ningún día de clase configurado", () => {
    expect(
      proximaClase({ diasSemana: new Set(), canceladas: new Set(), desde: LUNES }),
    ).toBeNull();
  });

  it("devuelve hoy con 0 días restantes si hoy es día de clase", () => {
    const resultado = proximaClase({
      diasSemana: new Set([LUNES.getDay()]),
      canceladas: new Set(),
      desde: LUNES,
    });
    expect(resultado.diasRestantes).toBe(0);
    expect(formatearFechaLocal(resultado.fecha)).toBe(
      formatearFechaLocal(LUNES),
    );
  });

  it("salta al siguiente día de clase si hoy está cancelado", () => {
    const resultado = proximaClase({
      diasSemana: new Set([LUNES.getDay()]),
      canceladas: new Set([formatearFechaLocal(LUNES)]),
      desde: LUNES,
    });
    expect(resultado.diasRestantes).toBe(7);
  });

  it("calcula correctamente varios días de la semana", () => {
    const miercoles = (LUNES.getDay() + 2) % 7;
    const resultado = proximaClase({
      diasSemana: new Set([miercoles]),
      canceladas: new Set(),
      desde: LUNES,
    });
    expect(resultado.diasRestantes).toBe(2);
  });
});

describe("proximaClaseEstudiante", () => {
  it("devuelve la próxima clase concreta del alumno", () => {
    const resultado = proximaClaseEstudiante(
      [
        {
          fecha: "2026-07-15",
          hora: "19:00:00",
          cancelada: false,
        },
        {
          fecha: "2026-07-14",
          hora: "18:00:00",
          cancelada: false,
        },
      ],
      LUNES,
    );

    expect(resultado.diasRestantes).toBe(1);
    expect(resultado.clases).toHaveLength(1);
    expect(resultado.clases[0].hora).toBe("18:00:00");
  });

  it("ignora clases canceladas", () => {
    const resultado = proximaClaseEstudiante(
      [
        {
          fecha: "2026-07-13",
          hora: "18:00:00",
          cancelada: true,
        },
        {
          fecha: "2026-07-20",
          hora: "18:00:00",
          cancelada: false,
        },
      ],
      LUNES,
    );

    expect(resultado.diasRestantes).toBe(7);
  });
});
