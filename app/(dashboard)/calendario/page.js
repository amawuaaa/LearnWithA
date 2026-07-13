import CalendarioDashboard from "@/components/CalendarioDashboard";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: horario }, { data: canceladas }, { data: eventos }] =
    await Promise.all([
      supabase.from("usuarios").select("rol").eq("id", user.id).single(),
      supabase
        .from("horario_clases")
        .select("*")
        .order("dia_semana", { ascending: true })
        .order("hora", { ascending: true }),
      supabase
        .from("clases_canceladas")
        .select("*")
        .order("fecha", { ascending: true }),
      supabase
        .from("eventos_calendario")
        .select("*")
        .order("fecha", { ascending: true }),
    ]);

  return (
    <CalendarioDashboard
      esAdmin={perfil?.rol === "admin"}
      horarioInicial={horario ?? []}
      canceladasIniciales={canceladas ?? []}
      eventosIniciales={eventos ?? []}
    />
  );
}
