import { test, expect } from "@playwright/test";
import { iniciarSesion, requiereCredencialesAlumno } from "./helpers/auth.js";

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!requiereCredencialesAlumno(), "Configura E2E_STUDENT_EMAIL y E2E_STUDENT_PASSWORD");
    await iniciarSesion(
      page,
      process.env.E2E_STUDENT_EMAIL,
      process.env.E2E_STUDENT_PASSWORD,
    );
  });

  test("el estudiante puede enviar un mensaje", async ({ page }) => {
    const texto = `Mensaje E2E ${Date.now()}`;
    await page.goto("/mensajes");
    await expect(
      page.getByRole("heading", { name: "Conversación con la profesora" }),
    ).toBeVisible();

    await page.getByLabel("Escribe un mensaje").fill(texto);
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByText(texto)).toBeVisible();
  });
});
