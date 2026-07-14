import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

export interface Perfil {
  nombre: string;
  avatar_url: string | null;
  rol: "admin" | "estudiante";
  nivel: string;
  creado_en?: string;
}

type PerfilActual = {
  user: User | null;
  perfil: Perfil | null;
};

type RequireAdminOk = {
  ok: true;
  user: User;
  perfil: Perfil;
};

type RequireAdminError = {
  ok: false;
  response: NextResponse;
};

export type RequireAdminResult = RequireAdminOk | RequireAdminError;

// Una sola consulta de usuario + perfil por petición (layout, página, etc.).
export const getPerfilActual = cache(async (): Promise<PerfilActual> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, perfil: null };
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, avatar_url, rol, nivel, creado_en")
    .eq("id", user.id)
    .single();

  return {
    user,
    perfil: perfil ?? {
      nombre: user.email?.split("@")[0] ?? "Estudiante",
      avatar_url: null,
      rol: "estudiante",
      nivel: "A1",
      creado_en: user.created_at,
    },
  };
});

export async function requireAdmin(): Promise<RequireAdminResult> {
  const { user, perfil } = await getPerfilActual();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  if (perfil.rol !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado." }, { status: 403 }),
    };
  }

  return { ok: true, user, perfil };
}
