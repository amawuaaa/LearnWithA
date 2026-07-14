import { test, expect } from "@playwright/test";
import {
  iniciarSesion,
  requiereCredencialesAdmin,
  requiereCredencialesAlumno,
} from "./helpers/auth.js";

test.describe("Panel de progreso", () => {
  test("el alumno no ve el enlace y /progreso lo devuelve al inicio", async ({
    page,
  }) => {
    test.skip(!requiereCredencialesAlumno(), "Faltan credenciales de alumno");
    await iniciarSesion(
      page,
      process.env.E2E_STUDENT_EMAIL,
      process.env.E2E_STUDENT_PASSWORD,
    );

    await expect(
      page.getByRole("link", { name: "Vocabulario" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Progreso" })).toHaveCount(0);

    await page.goto("/progreso");
    await expect(page).toHaveURL("/");
  });

  test("la profesora ve el progreso por alumno", async ({ page }) => {
    test.skip(!requiereCredencialesAdmin(), "Faltan credenciales de admin");
    await iniciarSesion(
      page,
      process.env.E2E_ADMIN_EMAIL,
      process.env.E2E_ADMIN_PASSWORD,
    );

    await page.getByRole("link", { name: "Progreso" }).click();
    await expect(page).toHaveURL("/progreso");
    await expect(
      page.getByRole("heading", { name: "Progreso de los alumnos" }),
    ).toBeVisible();
  });
});
