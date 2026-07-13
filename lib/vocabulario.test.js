import { describe, expect, it } from "vitest";
import {
  generarEjerciciosVocabulario,
  limpiarPalabras,
  palabrasValidas,
} from "./vocabulario";

const palabras = [
  {
    termino: "apple",
    significado: "manzana",
    pronunciacion: "/ˈæp.əl/",
    ejemplo: "I eat an apple.",
  },
  {
    termino: "bread",
    significado: "pan",
    pronunciacion: "/bred/",
    ejemplo: "The bread is fresh.",
  },
  {
    termino: "milk",
    significado: "leche",
    pronunciacion: "/mɪlk/",
    ejemplo: "I drink milk.",
  },
  {
    termino: "cheese",
    significado: "queso",
    pronunciacion: "/tʃiːz/",
    ejemplo: "This cheese is good.",
  },
];

describe("utilidades de vocabulario", () => {
  it("limpia los campos de cada palabra", () => {
    const resultado = limpiarPalabras([
      {
        termino: " apple ",
        significado: " manzana ",
        pronunciacion: " /ˈæp.əl/ ",
        ejemplo: " I eat an apple. ",
      },
    ]);

    expect(resultado[0].termino).toBe("apple");
    expect(resultado[0].significado).toBe("manzana");
  });

  it("exige al menos cuatro palabras completas y distintas", () => {
    expect(palabrasValidas(palabras)).toBe(true);
    expect(palabrasValidas(palabras.slice(0, 3))).toBe(false);
    expect(
      palabrasValidas([
        ...palabras.slice(0, 3),
        { ...palabras[3], significado: "pan" },
      ]),
    ).toBe(false);
  });

  it("genera un ejercicio con cuatro opciones por palabra", () => {
    const ejercicios = generarEjerciciosVocabulario(palabras);

    expect(ejercicios).toHaveLength(4);
    expect(ejercicios[0].opciones).toHaveLength(4);
    expect(ejercicios[0].opciones).toContain("manzana");
    expect(ejercicios[0].respuesta_correcta).toBe("manzana");
  });
});
