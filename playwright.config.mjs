import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

function cargarEnv(archivo) {
  const ruta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), archivo);
  if (!fs.existsSync(ruta)) return;

  for (const linea of fs.readFileSync(ruta, "utf8").split("\n")) {
    const coincidencia = linea.match(/^([^#=]+)=(.*)$/);
    if (!coincidencia) continue;
    const clave = coincidencia[1].trim();
    const valor = coincidencia[2].trim();
    if (!(clave in process.env)) {
      process.env[clave] = valor;
    }
  }
}

cargarEnv(".env.local");
cargarEnv(".env.e2e.local");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.CI ? "pnpm start" : "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
