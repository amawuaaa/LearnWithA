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
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-slate-900 focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <Sidebar
        perfil={{ ...perfil, id: user.id }}
        mensajesNoLeidos={mensajesNoLeidos ?? 0}
      />
      <main
        id="contenido-principal"
        className="min-h-screen min-w-0 overflow-x-hidden px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-8"
      >
        <div className="mx-auto min-w-0 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
