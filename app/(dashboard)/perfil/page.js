import ProfileDashboard from "@/components/ProfileDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, avatar_url, rol, creado_en")
    .eq("id", user.id)
    .single();

  const perfilVisible = perfil ?? {
    nombre: user.email?.split("@")[0] ?? "Estudiante",
    avatar_url: null,
    rol: "estudiante",
    creado_en: user.created_at,
  };
  const esAdmin = perfilVisible.rol === "admin";
  const consultas = [
    supabase
      .from("mensualidades")
      .select("*, usuarios(nombre)")
      .order("periodo", { ascending: false }),
    supabase
      .from("estudiantes_progreso")
      .select("id", { count: "exact", head: true }),
  ];

  if (esAdmin) {
    consultas.push(
      supabase
        .from("usuarios")
        .select("id, nombre")
        .eq("rol", "estudiante")
        .order("nombre"),
    );
  }

  const [mensualidadesResult, progresoResult, estudiantesResult] =
    await Promise.all(consultas);

  return (
    <ProfileDashboard
      usuario={{ id: user.id, email: user.email }}
      perfil={perfilVisible}
      mensualidades={mensualidadesResult.data ?? []}
      estudiantes={estudiantesResult?.data ?? []}
      testsCompletados={progresoResult.count ?? 0}
    />
  );
}
