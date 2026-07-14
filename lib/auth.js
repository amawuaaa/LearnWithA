import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cache } from "react";

// Una sola consulta de usuario + perfil por petición (layout, página, etc.).
export const getPerfilActual = cache(async () => {
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

export async function requireAdmin() {
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
