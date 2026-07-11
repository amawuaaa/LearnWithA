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

  return (
    <div className="min-h-screen">
      <Sidebar perfil={perfilVisible} />
      <main className="min-h-screen px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
