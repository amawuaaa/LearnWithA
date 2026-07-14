import { test, expect } from "@playwright/test";
import { iniciarSesion, requiereCredencialesAlumno } from "./helpers/auth.js";

test.describe("Perfil y calendario (alumno)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!requiereCredencialesAlumno(), "Faltan credenciales");
    await iniciarSesion(
      page,
      process.env.E2E_STUDENT_EMAIL,
      process.env.E2E_STUDENT_PASSWORD,
    );
  });

  test("perfil renderiza tras la división", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
    await expect(page.getByText("Cambiar foto")).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar nombre" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mis mensualidades" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();

    // Edición de nombre: abre y cancela sin guardar.
    await page.getByRole("button", { name: "Editar nombre" }).click();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("button", { name: "Editar nombre" })).toBeVisible();
  });

  test("calendario renderiza y abre el detalle del día", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page.getByRole("heading", { name: "Calendario" })).toBeVisible();
    await expect(page.getByText("Día con clase")).toBeVisible();
    await expect(page.getByRole("button", { name: "Hoy" })).toBeVisible();

    // Cambia de mes (carga lazy) y vuelve.
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await page.getByRole("button", { name: "Hoy" }).click();

    // Abre el modal del día 15 y ciérralo.
    await page.getByRole("button", { name: /^15/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
