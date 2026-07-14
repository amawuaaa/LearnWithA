import fs from "node:fs";
import path from "node:path";

export function cargarEnvLocal(raizProyecto) {
  const ruta = path.join(raizProyecto, ".env.local");
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
