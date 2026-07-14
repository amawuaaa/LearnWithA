import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { MIGRACION_MINIMA } from "./esquemaRequerido.js";
import {
  extraerNumeroMigracion,
  validarSchemaSql,
  validarSecuenciaMigraciones,
  verificarRepositorio,
} from "./verificarMigraciones.js";

describe("extraerNumeroMigracion", () => {
  it("lee el prefijo numérico", () => {
    expect(extraerNumeroMigracion("027_perfiles_visibles.sql")).toBe(27);
  });
});

describe("validarSecuenciaMigraciones", () => {
  it("detecta huecos en la numeración", () => {
    const errores = validarSecuenciaMigraciones([
      "001_inicio.sql",
      "003_salto.sql",
    ]);
    expect(errores[0]).toContain("Secuencia rota");
  });

  it("exige que la última migración coincida con MIGRACION_MINIMA", () => {
    const archivos = Array.from(
      { length: MIGRACION_MINIMA - 1 },
      (_, indice) => `${String(indice + 1).padStart(3, "0")}_m.sql`,
    );
    const errores = validarSecuenciaMigraciones(archivos);
    expect(errores[0]).toContain("MIGRACION_MINIMA");
  });
});

describe("validarSchemaSql", () => {
  it("marca RPCs ausentes", () => {
    const errores = validarSchemaSql("create table public.usuarios (\n);");
    expect(errores.some((error) => error.includes("generar_clases_mes"))).toBe(
      true,
    );
  });
});

describe("verificarRepositorio", () => {
  it("pasa en el repositorio actual", () => {
    const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    expect(verificarRepositorio(raiz)).toEqual([]);
  });
});
