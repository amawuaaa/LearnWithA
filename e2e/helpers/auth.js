export async function iniciarSesion(page, email, password) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/");
}

export function requiereCredencialesAlumno() {
  return Boolean(
    process.env.E2E_STUDENT_EMAIL && process.env.E2E_STUDENT_PASSWORD,
  );
}

export function requiereCredencialesAdmin() {
  return Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
}

// Distingue un Supabase real del placeholder que usa la CI cuando no hay
// secrets: los tests que tocan la API de registro necesitan el real.
export function hayEntornoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.startsWith("https://") && !url.includes("placeholder");
}
