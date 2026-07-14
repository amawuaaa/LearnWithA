import ProfileDashboard from "@/components/ProfileDashboard";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";
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
        .select("id, nombre, nivel")
        .eq("rol", "estudiante")
        .order("nombre"),
      supabase
        .from("codigos_registro")
        .select("codigo, creado_en")
        .eq("activo", true)
        .maybeSingle(),
    );
  }

  const [
    mensualidadesResult,
    progresoResult,
    estudiantesResult,
    codigoRegistroResult,
  ] =
    await Promise.all(consultas);

  return (
    <ProfileDashboard
      usuario={{ id: user.id, email: user.email }}
      perfil={perfil}
      mensualidades={mensualidadesResult.data ?? []}
      mensualidadesError={
        mensualidadesResult.error
          ? "No se pudieron cargar las mensualidades. Comprueba que la tabla existe en Supabase."
          : null
      }
      estudiantes={estudiantesResult?.data ?? []}
      testsCompletados={progresoResult.count ?? 0}
      codigoRegistro={codigoRegistroResult?.data ?? null}
    />
  );
}
