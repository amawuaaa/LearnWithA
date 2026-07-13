import { describe, expect, it } from "vitest";
import { nivelDesbloqueado } from "./niveles";

describe("nivelDesbloqueado", () => {
  it("desbloquea contenido sin nivel asignado para cualquiera", () => {
    expect(nivelDesbloqueado(null, "A1")).toBe(true);
    expect(nivelDesbloqueado(undefined, null)).toBe(true);
  });

  it("desbloquea contenido del mismo nivel del alumno", () => {
    expect(nivelDesbloqueado("B1", "B1")).toBe(true);
  });

  it("desbloquea contenido de un nivel inferior al del alumno", () => {
    expect(nivelDesbloqueado("A1", "B1")).toBe(true);
  });

  it("bloquea contenido de un nivel superior al del alumno", () => {
    expect(nivelDesbloqueado("B2", "A2")).toBe(false);
  });

  it("trata al alumno sin nivel asignado como A1", () => {
    expect(nivelDesbloqueado("A1", null)).toBe(true);
    expect(nivelDesbloqueado("A2", null)).toBe(false);
  });
});
