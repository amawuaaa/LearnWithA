import { test, expect } from "@playwright/test";
import { iniciarSesion, requiereCredencialesAlumno } from "./helpers/auth.js";

test.describe("Tests", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!requiereCredencialesAlumno(), "Configura E2E_STUDENT_EMAIL y E2E_STUDENT_PASSWORD");
    await iniciarSesion(
      page,
      process.env.E2E_STUDENT_EMAIL,
      process.env.E2E_STUDENT_PASSWORD,
    );
  });

  test("el estudiante puede completar un mini-test desbloqueado", async ({ page }) => {
    await page.goto("/tests");
    await expect(page.getByRole("heading", { name: "Tests" })).toBeVisible();

    const empezar = page.getByRole("button", { name: "Empezar" }).first();
    const hayTest = await empezar.isVisible().catch(() => false);
    test.skip(!hayTest, "No hay tests desbloqueados para el alumno E2E");

    await empezar.click();

    const preguntas = page.locator("fieldset");
    const total = await preguntas.count();
    expect(total).toBeGreaterThan(0);

    for (let indice = 0; indice < total; indice += 1) {
      await preguntas.nth(indice).locator('input[type="radio"]').first().check();
    }

    await page.getByRole("button", { name: "Terminar test" }).click();
    await expect(page.getByText(/Resultado:/)).toBeVisible();
  });
});
