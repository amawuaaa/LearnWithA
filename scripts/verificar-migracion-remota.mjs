import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cargarEnvLocal } from "./cargar-env-local.mjs";

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
cargarEnvLocal(raizProyecto);
const dbUrl = process.env.SUPABASE_DB_URL?.trim();

if (!dbUrl) {
  console.error("Falta SUPABASE_DB_URL para verificar la migración en Supabase.");
  process.exit(1);
}

const consulta = `
select pol.polname as politica
from pg_policy pol
join pg_class cls on cls.oid = pol.polrelid
join pg_namespace nsp on nsp.oid = cls.relnamespace
where nsp.nspname = 'public'
  and cls.relname = 'usuarios'
  and pol.polname = 'Usuarios pueden leer perfiles visibles';
`;

const temporal = path.join(raizProyecto, ".tmp-verificar-migracion.sql");
fs.writeFileSync(temporal, consulta);

const supabaseBin = path.join(raizProyecto, "node_modules", ".bin", "supabase");
const comando = fs.existsSync(supabaseBin) ? supabaseBin : "supabase";

const resultado = spawnSync(
  comando,
  ["db", "query", "--file", temporal, "--db-url", dbUrl],
  { encoding: "utf8", env: process.env },
);

fs.rmSync(temporal, { force: true });

const salida = `${resultado.stdout ?? ""}${resultado.stderr ?? ""}`;
if (resultado.status === 0 && salida.includes("Usuarios pueden leer perfiles visibles")) {
  console.log("Migración 027 verificada: política RLS activa en Supabase.");
  process.exit(0);
}

if (resultado.status === 0) {
  console.error("La migración 027 no está aplicada. Ejecuta: pnpm db:migrate:027");
  process.exit(1);
}

console.error("No se pudo verificar la migración remota.");
process.exit(resultado.status ?? 1);
