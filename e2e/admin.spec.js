import { test, expect } from "@playwright/test";
import { iniciarSesion, requiereCredencialesAdmin } from "./helpers/auth.js";

test.describe("Admin", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !requiereCredencialesAdmin(),
      "Configura E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD",
    );
    await iniciarSesion(
      page,
      process.env.E2E_ADMIN_EMAIL,
      process.env.E2E_ADMIN_PASSWORD,
    );
  });

  test("puede iniciar sesión y ver la navegación", async ({ page }) => {
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("puede crear y eliminar un anuncio", async ({ page }) => {
    const titulo = `Anuncio E2E ${Date.now()}`;
    await page.goto("/anuncios");
    await page.getByRole("button", { name: "Nuevo anuncio" }).click();

    const modalNuevo = page.getByRole("dialog", { name: "Nuevo anuncio" });
    await modalNuevo.getByLabel("Título").fill(titulo);
    await modalNuevo
      .getByLabel("Contenido")
      .fill("Anuncio creado por un test E2E. Se elimina automáticamente.");
    await modalNuevo.getByRole("button", { name: "Publicar" }).click();

    await expect(page.getByRole("heading", { name: titulo })).toBeVisible();

    // Limpieza: el anuncio recién creado queda el primero de la lista.
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    const dialogo = page.getByRole("dialog", { name: "Eliminar anuncio" });
    await expect(dialogo).toContainText(titulo);
    await dialogo.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByRole("heading", { name: titulo })).toBeHidden();
  });

  test("puede responder en la conversación de un alumno", async ({ page }) => {
    await page.goto("/mensajes");
    await expect(page.getByRole("heading", { name: "Mensajes" })).toBeVisible();

    const campo = page.getByLabel("Escribe un mensaje");
    test.skip((await campo.count()) === 0, "No hay conversaciones con alumnos");

    const texto = `Respuesta E2E ${Date.now()}`;
    await campo.fill(texto);
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByText(texto)).toBeVisible();
  });
});
