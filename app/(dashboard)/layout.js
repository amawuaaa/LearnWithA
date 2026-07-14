import Sidebar from "@/components/Sidebar";
import { getPerfilActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const { user, perfil } = await getPerfilActual();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  let consultaNoLeidos = supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .is("leido_en", null)
    .neq("remitente_id", user.id);

  if (perfil.rol !== "admin") {
    consultaNoLeidos = consultaNoLeidos.eq("estudiante_id", user.id);
  }

  const { count: mensajesNoLeidos } = await consultaNoLeidos;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar
        perfil={{ ...perfil, id: user.id }}
        mensajesNoLeidos={mensajesNoLeidos ?? 0}
      />
      <main className="min-h-screen min-w-0 overflow-x-hidden px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-8">
        <div className="mx-auto min-w-0 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
