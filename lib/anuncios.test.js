import { describe, expect, it } from "vitest";
import { ordenarAnuncios } from "./anuncios";

describe("ordenarAnuncios", () => {
  it("ordena por fecha descendente", () => {
    const anuncios = [
      { id: 1, creado_en: "2026-01-01T10:00:00Z" },
      { id: 2, creado_en: "2026-03-01T10:00:00Z" },
      { id: 3, creado_en: "2026-02-01T10:00:00Z" },
    ];

    const ordenados = ordenarAnuncios(anuncios);

    expect(ordenados.map((anuncio) => anuncio.id)).toEqual([2, 3, 1]);
  });

  it("no muta el array original", () => {
    const anuncios = [
      { id: 1, creado_en: "2026-01-01T10:00:00Z" },
      { id: 2, creado_en: "2026-03-01T10:00:00Z" },
    ];

    ordenarAnuncios(anuncios);

    expect(anuncios[0].id).toBe(1);
  });
});
