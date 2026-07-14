import { test, expect } from "@playwright/test";
import { iniciarSesion, requiereCredencialesAlumno } from "./helpers/auth.js";

const RUTAS_IA = [
  "/api/generar-test",
  "/api/generar-vocabulario",
  "/api/generar-memoria",
];

test.describe("Rutas de IA (solo admin)", () => {
  for (const ruta of RUTAS_IA) {
    test(`${ruta} rechaza peticiones sin sesión`, async ({ request }) => {
      const respuesta = await request.post(ruta, {
        data: { tema: "E2E" },
        maxRedirects: 0,
      });
      const status = respuesta.status();

      // Dos capas: el middleware redirige a /login sin sesión y, si algún día
      // dejara pasar la petición, requireAdmin respondería 401.
      if (status >= 300 && status < 400) {
        expect(respuesta.headers()["location"]).toContain("/login");
      } else {
        expect(status).toBe(401);
      }
    });
  }

  test("devuelven 403 con sesión de alumno", async ({ page }) => {
    test.skip(
      !requiereCredencialesAlumno(),
      "Configura E2E_STUDENT_EMAIL y E2E_STUDENT_PASSWORD",
    );
    await iniciarSesion(
      page,
      process.env.E2E_STUDENT_EMAIL,
      process.env.E2E_STUDENT_PASSWORD,
    );

    for (const ruta of RUTAS_IA) {
      const respuesta = await page.request.post(ruta, {
        data: { tema: "E2E" },
      });
      expect(respuesta.status(), ruta).toBe(403);
    }
  });
});
