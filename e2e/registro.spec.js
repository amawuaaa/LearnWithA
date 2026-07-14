import { test, expect } from "@playwright/test";
import { hayEntornoSupabase } from "./helpers/auth.js";

test.describe("Registro", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Regístrate" }).click();
  });

  test("muestra el formulario de registro", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Crear una cuenta" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByLabel("Código de clase")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Repetir contraseña")).toBeVisible();
  });

  test("un código de clase inválido muestra un error", async ({ page }) => {
    test.skip(!hayEntornoSupabase(), "Necesita un proyecto Supabase real");

    const password = `E2e-registro-${Date.now()}`;
    await page.getByLabel("Nombre").fill("Prueba E2E");
    await page
      .getByLabel("Código de clase")
      .fill(`codigo-invalido-${Date.now()}`);
    await page
      .getByLabel("Email")
      .fill(`e2e.registro.${Date.now()}@example.com`);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Repetir contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // Si se repite mucho en local puede saltar antes el límite de intentos.
    await expect(
      page
        .getByText("El código de clase no es correcto.")
        .or(page.getByText("Demasiados intentos de registro", { exact: false })),
    ).toBeVisible();
  });

  test("un código de clase válido crea la cuenta", async ({ page }) => {
    test.skip(
      !process.env.E2E_REGISTRATION_CODE,
      "Configura E2E_REGISTRATION_CODE (crea una cuenta real en cada ejecución)",
    );

    const password = `E2e-registro-${Date.now()}`;
    await page.getByLabel("Nombre").fill("Prueba E2E registro");
    await page
      .getByLabel("Código de clase")
      .fill(process.env.E2E_REGISTRATION_CODE);
    await page
      .getByLabel("Email")
      .fill(`e2e.registro.${Date.now()}@example.com`);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Repetir contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // Según la configuración de Supabase: entra directamente o pide confirmar
    // el email antes de poder acceder.
    await expect(
      page
        .getByRole("navigation")
        .or(page.getByText("Cuenta creada", { exact: false })),
    ).toBeVisible();
  });
});
