import ProfileDashboard from "@/components/ProfileDashboard";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";
  const consultas = [
    supabase
      .from("estudiantes_progreso")
      .select("id", { count: "exact", head: true }),
  ];

  if (!esAdmin) {
    consultas.push(
      supabase
        .from("mensualidades")
        .select("importe, estado, periodo")
        .order("periodo", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
  }

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

  const resultados = await Promise.all(consultas);
  const progresoResult = resultados[0];
  let ultimaMensualidad = null;
  let estudiantes = [];
  let codigoRegistro = null;

  if (!esAdmin) {
    ultimaMensualidad = resultados[1]?.data ?? null;
  } else {
    estudiantes = resultados[1]?.data ?? [];
    codigoRegistro = resultados[2]?.data ?? null;
  }

  return (
    <ProfileDashboard
      usuario={{ id: user.id, email: user.email }}
      perfil={perfil}
      ultimaMensualidad={ultimaMensualidad}
      estudiantes={estudiantes}
      testsCompletados={progresoResult.count ?? 0}
      codigoRegistro={codigoRegistro}
    />
  );
}
