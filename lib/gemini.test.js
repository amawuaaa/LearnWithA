import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  debeReintentarModelo,
  generarJsonConGemini,
  obtenerModelosGemini,
} from "./gemini.js";

describe("obtenerModelosGemini", () => {
  const original = process.env.GEMINI_MODELS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.GEMINI_MODELS;
    } else {
      process.env.GEMINI_MODELS = original;
    }
  });

  it("usa modelos por defecto si no hay variable de entorno", () => {
    delete process.env.GEMINI_MODELS;
    expect(obtenerModelosGemini()).toEqual([
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash",
    ]);
  });

  it("lee la lista desde GEMINI_MODELS", () => {
    process.env.GEMINI_MODELS = "modelo-a, modelo-b";
    expect(obtenerModelosGemini()).toEqual(["modelo-a", "modelo-b"]);
  });
});

describe("debeReintentarModelo", () => {
  it("reintenta cuando el modelo no existe o el servicio está saturado", () => {
    expect(debeReintentarModelo(404)).toBe(true);
    expect(debeReintentarModelo(429)).toBe(true);
    expect(debeReintentarModelo(503)).toBe(true);
  });

  it("no reintenta errores de validación", () => {
    expect(debeReintentarModelo(400)).toBe(false);
    expect(debeReintentarModelo(401)).toBe(false);
  });
});

describe("generarJsonConGemini", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModelos = process.env.GEMINI_MODELS;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
    if (originalModelos === undefined) {
      delete process.env.GEMINI_MODELS;
    } else {
      process.env.GEMINI_MODELS = originalModelos;
    }
  });

  it("devuelve error de configuración sin API key", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      generarJsonConGemini({ prompt: "hola", responseSchema: {} }),
    ).resolves.toEqual({ error: "configuracion" });
  });

  it("prueba el siguiente modelo si el primero responde 404", async () => {
    process.env.GEMINI_API_KEY = "clave";
    process.env.GEMINI_MODELS = "modelo-a,modelo-b";

    fetch
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ candidates: [] }),
      });

    const resultado = await generarJsonConGemini({
      prompt: "hola",
      responseSchema: { type: "OBJECT" },
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(resultado.modelo).toBe("modelo-b");
  });

  it("devuelve no_disponible si todos los modelos fallan", async () => {
    process.env.GEMINI_API_KEY = "clave";
    process.env.GEMINI_MODELS = "modelo-a";

    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: "busy" } }),
    });

    await expect(
      generarJsonConGemini({ prompt: "hola", responseSchema: {} }),
    ).resolves.toEqual({ error: "no_disponible", estado: 503 });
  });
});
