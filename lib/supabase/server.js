import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Crea un cliente nuevo por petición para no compartir sesiones entre usuarios.
export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Un Server Component no puede escribir cookies. El middleware
            // se encargará de refrescar la sesión cuando sea necesario.
          }
        },
      },
    },
  );
}
