import { describe, expect, it } from "vitest";
import { agruparAsignacionesPorContenido } from "./asignaciones";

describe("agruparAsignacionesPorContenido", () => {
  it("agrupa alumnos por test o lección", () => {
    const mapa = agruparAsignacionesPorContenido(
      [
        { test_id: "t1", estudiante_id: "a" },
        { test_id: "t1", estudiante_id: "b" },
        { test_id: "t2", estudiante_id: "a" },
      ],
      "test_id",
    );

    expect(mapa.get("t1")).toEqual(["a", "b"]);
    expect(mapa.get("t2")).toEqual(["a"]);
  });
});
