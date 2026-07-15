import PagosDashboard from "@/components/PagosDashboard";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PagosPage() {
  const { perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";

  const consultas = [
    supabase
      .from("mensualidades")
      .select("*, usuarios(nombre)")
      .order("periodo", { ascending: false }),
  ];

  if (esAdmin) {
    consultas.push(
      supabase
        .from("usuarios")
        .select("id, nombre, nivel")
        .eq("rol", "estudiante")
        .order("nombre"),
    );
  }

  const [mensualidadesResult, estudiantesResult] = await Promise.all(consultas);

  return (
    <PagosDashboard
      esAdmin={esAdmin}
      mensualidades={mensualidadesResult.data ?? []}
      mensualidadesError={
        mensualidadesResult.error
          ? "No se pudieron cargar las mensualidades. Comprueba que la tabla existe en Supabase."
          : null
      }
      estudiantes={estudiantesResult?.data ?? []}
    />
  );
}
