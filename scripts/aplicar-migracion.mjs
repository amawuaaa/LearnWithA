import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cargarEnvLocal } from "./cargar-env-local.mjs";

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
cargarEnvLocal(raizProyecto);
const numero = process.argv[2] ?? "027";

const coincidencias = fs
  .readdirSync(path.join(raizProyecto, "supabase", "migrations"))
  .filter((nombre) => nombre.startsWith(`${numero.padStart(3, "0")}_`));

if (coincidencias.length === 0) {
  console.error(`No se encontró la migración ${numero}.`);
  process.exit(1);
}

const rutaMigracion = path.join(
  raizProyecto,
  "supabase",
  "migrations",
  coincidencias[0],
);

const dbUrl = process.env.SUPABASE_DB_URL?.trim();
if (!dbUrl) {
  console.error(
    "Falta SUPABASE_DB_URL. Añádela a .env.local (Supabase → Settings → Database → Connection string).",
  );
  console.error(`Migración pendiente: ${coincidencias[0]}`);
  process.exit(1);
}

const supabaseBin = path.join(raizProyecto, "node_modules", ".bin", "supabase");
const comando = fs.existsSync(supabaseBin) ? supabaseBin : "supabase";

const sql = fs.readFileSync(rutaMigracion, "utf8");
const sentencias = sql
  .split(";")
  .map((trozo) => trozo.trim())
  .filter((trozo) => trozo.length > 0 && !trozo.startsWith("--"));

for (const sentencia of sentencias) {
  const temporal = path.join(raizProyecto, ".tmp-migracion.sql");
  fs.writeFileSync(temporal, `${sentencia};`);

  const resultado = spawnSync(
    comando,
    ["db", "query", "--file", temporal, "--db-url", dbUrl],
    { stdio: "inherit", env: process.env },
  );

  fs.rmSync(temporal, { force: true });

  if (resultado.status !== 0) {
    console.error(`No se pudo aplicar ${coincidencias[0]}. Comprueba SUPABASE_DB_URL y permisos.`);
    process.exit(resultado.status ?? 1);
  }
}

console.log(`Migración ${coincidencias[0]} aplicada correctamente.`);
process.exit(0);
