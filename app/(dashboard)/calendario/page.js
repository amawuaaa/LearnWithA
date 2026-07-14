import CalendarioDashboard from "@/components/CalendarioDashboard";
import { getPerfilActual } from "@/lib/auth";
import { formatearFechaLocal } from "@/lib/horario";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarioPage() {
  const { user, perfil } = await getPerfilActual();
  const supabase = await createClient();
  const esAdmin = perfil.rol === "admin";
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 30);
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 365);
  const desdeStr = formatearFechaLocal(desde);
  const hastaStr = formatearFechaLocal(hasta);

  const consultas = [
    supabase
      .from("clases_estudiante")
      .select(
        "*, estudiante:usuarios!clases_estudiante_estudiante_id_fkey(nombre)",
      )
      .gte("fecha", desdeStr)
      .lte("fecha", hastaStr)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true }),
    supabase
      .from("eventos_calendario")
      .select("*")
      .order("fecha", { ascending: true }),
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
  const clases = resultados[0].data ?? [];
  const eventos = resultados[1].data ?? [];
  const estudiantes = esAdmin ? (resultados[2]?.data ?? []) : [];

  return (
    <CalendarioDashboard
      esAdmin={esAdmin}
      clasesIniciales={clases}
      eventosIniciales={eventos}
      estudiantes={estudiantes}
      usuarioId={user.id}
    />
  );
}
