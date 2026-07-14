import { test, expect } from "@playwright/test";
import { iniciarSesion, requiereCredencialesAlumno } from "./helpers/auth.js";

test.describe("Login", () => {
  test("muestra el formulario de acceso", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
  });

  test("permite entrar como estudiante", async ({ page }) => {
    test.skip(!requiereCredencialesAlumno(), "Configura E2E_STUDENT_EMAIL y E2E_STUDENT_PASSWORD");

    await iniciarSesion(
      page,
      process.env.E2E_STUDENT_EMAIL,
      process.env.E2E_STUDENT_PASSWORD,
    );

    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page).toHaveURL("/");
  });
});
