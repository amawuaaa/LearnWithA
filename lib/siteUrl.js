/** URL pública de producción (emails de auth no deben apuntar a localhost). */
export const SITE_URL_PRODUCCION = "https://learn-with-a.vercel.app";

function normalizarUrl(valor) {
  if (!valor) return null;
  return String(valor).trim().replace(/\/$/, "");
}

function esLocalhost(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * URL canónica del sitio para auth (recuperar contraseña, etc.).
 * Prioridad: NEXT_PUBLIC_SITE_URL → origen del navegador → producción.
 * Si el resultado fuera localhost, fuerza la URL de producción para que
 * los emails de Supabase no manden a localhost.
 */
export function getPublicSiteUrl() {
  const desdeEnv = normalizarUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (desdeEnv && !esLocalhost(desdeEnv)) {
    return desdeEnv;
  }

  if (typeof window !== "undefined") {
    const origen = normalizarUrl(window.location.origin);
    if (origen && !esLocalhost(origen)) {
      return origen;
    }
  }

  if (desdeEnv) {
    // Solo llegamos aquí si la env es localhost: no sirve para emails.
  }

  return SITE_URL_PRODUCCION;
}

export function urlCallbackRecuperarPassword() {
  return `${getPublicSiteUrl()}/auth/callback?next=/actualizar-password`;
}
