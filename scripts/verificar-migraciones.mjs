import path from "node:path";
import { fileURLToPath } from "node:url";

import { verificarRepositorio } from "../lib/verificarMigraciones.js";

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errores = verificarRepositorio(raizProyecto);

if (errores.length === 0) {
  console.log("Migraciones y schema.sql están sincronizados.");
  process.exit(0);
}

console.error("Verificación de migraciones fallida:\n");
for (const error of errores) {
  console.error(`- ${error}`);
}
process.exit(1);
