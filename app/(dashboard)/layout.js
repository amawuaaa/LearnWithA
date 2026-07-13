import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, avatar_url, rol")
    .eq("id", user.id)
    .single();

  const perfilVisible = perfil ?? {
    nombre: user.email?.split("@")[0] ?? "Estudiante",
    avatar_url: null,
    rol: "estudiante",
  };
  let consultaNoLeidos = supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .is("leido_en", null)
    .neq("remitente_id", user.id);

  if (perfilVisible.rol !== "admin") {
    consultaNoLeidos = consultaNoLeidos.eq("estudiante_id", user.id);
  }

  const { count: mensajesNoLeidos } = await consultaNoLeidos;

  return (
    <div className="min-h-screen">
      <Sidebar
        perfil={{ ...perfilVisible, id: user.id }}
        mensajesNoLeidos={mensajesNoLeidos ?? 0}
      />
      <main className="min-h-screen px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
