import CalendarioDashboard from "@/components/CalendarioDashboard";
import { cargarDatosCalendario } from "@/lib/calendario/consultas";
import { getPerfilActual } from "@/lib/auth";
import { claveMes } from "@/lib/horario";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarioPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";
  const hoy = new Date();
  const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const consultas = [
    cargarDatosCalendario(supabase, mesActual.getFullYear(), mesActual.getMonth(), {
      esAdmin,
      usuarioId: user.id,
    }),
  ];

  if (esAdmin) {
    consultas.push(
      supabase
        .from("usuarios")
        .select("id, nombre")
        .eq("rol", "estudiante")
        .order("nombre", { ascending: true }),
    );
  }

  const resultados = await Promise.all(consultas);
  const { clases, eventos } = resultados[0];
  const estudiantes = esAdmin ? (resultados[1]?.data ?? []) : [];

  return (
    <CalendarioDashboard
      esAdmin={esAdmin}
      clasesIniciales={clases}
      eventosIniciales={eventos}
      estudiantes={estudiantes}
      usuarioId={user.id}
      mesInicial={claveMes(mesActual)}
    />
  );
}
