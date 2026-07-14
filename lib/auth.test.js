import { describe, expect, it, vi, beforeEach } from "vitest";

// `cache()` de React solo existe en el entorno de Server Components; para el
// test basta con que devuelva la función sin memorizar.
vi.mock("react", () => ({ cache: (fn) => fn }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getPerfilActual, requireAdmin } from "./auth.js";

function supabaseFalso({ user = null, perfil = null } = {}) {
  return {
    auth: {
      getUser: async () => ({ data: { user } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: perfil }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  createClient.mockReset();
});

describe("requireAdmin", () => {
  it("devuelve 401 si no hay usuario", async () => {
    createClient.mockResolvedValue(supabaseFalso());

    const resultado = await requireAdmin();

    expect(resultado.ok).toBe(false);
    expect(resultado.response.status).toBe(401);
  });

  it("devuelve 403 si el usuario no es admin", async () => {
    createClient.mockResolvedValue(
      supabaseFalso({
        user: { id: "user-1", email: "alumno@ejemplo.com" },
        perfil: { nombre: "Alumno", rol: "estudiante", nivel: "A1" },
      }),
    );

    const resultado = await requireAdmin();

    expect(resultado.ok).toBe(false);
    expect(resultado.response.status).toBe(403);
  });

  it("devuelve 403 si el usuario no tiene perfil (rol por defecto)", async () => {
    createClient.mockResolvedValue(
      supabaseFalso({
        user: { id: "user-1", email: "alguien@ejemplo.com" },
        perfil: null,
      }),
    );

    const resultado = await requireAdmin();

    expect(resultado.ok).toBe(false);
    expect(resultado.response.status).toBe(403);
  });

  it("deja pasar a un admin con su usuario y perfil", async () => {
    const perfil = { nombre: "Profesora", rol: "admin", nivel: "C2" };
    createClient.mockResolvedValue(
      supabaseFalso({
        user: { id: "admin-1", email: "profesora@ejemplo.com" },
        perfil,
      }),
    );

    const resultado = await requireAdmin();

    expect(resultado.ok).toBe(true);
    expect(resultado.user.id).toBe("admin-1");
    expect(resultado.perfil).toEqual(perfil);
    expect(resultado.response).toBeUndefined();
  });
});

describe("getPerfilActual", () => {
  it("devuelve nulos sin sesión", async () => {
    createClient.mockResolvedValue(supabaseFalso());

    expect(await getPerfilActual()).toEqual({ user: null, perfil: null });
  });

  it("usa un perfil por defecto si el usuario no tiene fila en usuarios", async () => {
    createClient.mockResolvedValue(
      supabaseFalso({
        user: {
          id: "user-1",
          email: "nueva@ejemplo.com",
          created_at: "2026-01-01T00:00:00Z",
        },
        perfil: null,
      }),
    );

    const { perfil } = await getPerfilActual();

    expect(perfil).toEqual({
      nombre: "nueva",
      avatar_url: null,
      rol: "estudiante",
      nivel: "A1",
      creado_en: "2026-01-01T00:00:00Z",
    });
  });
});
