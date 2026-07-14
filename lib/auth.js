import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

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
