import fs from "node:fs";
import path from "node:path";

import {
  MIGRACION_MINIMA,
  POLITICAS_REQUERIDAS,
  RPCS_REQUERIDOS,
  TABLAS_REQUERIDAS,
} from "./esquemaRequerido.js";

const PATRON_MIGRACION = /^(\d{3})_.+\.sql$/;

export function extraerNumeroMigracion(nombreArchivo) {
  const coincidencia = nombreArchivo.match(PATRON_MIGRACION);
  return coincidencia ? Number(coincidencia[1]) : null;
}

export function listarMigraciones(directorioMigraciones) {
  return fs
    .readdirSync(directorioMigraciones)
    .filter((nombre) => PATRON_MIGRACION.test(nombre))
    .sort((a, b) => extraerNumeroMigracion(a) - extraerNumeroMigracion(b));
}

export function validarSecuenciaMigraciones(archivos) {
  const errores = [];

  if (archivos.length === 0) {
    errores.push("No se encontraron archivos en supabase/migrations/.");
    return errores;
  }

  const numeros = archivos.map(extraerNumeroMigracion);

  for (let indice = 0; indice < numeros.length; indice += 1) {
    const esperado = indice + 1;
    if (numeros[indice] !== esperado) {
      errores.push(
        `Secuencia rota: se esperaba ${String(esperado).padStart(3, "0")}_*.sql y aparece ${archivos[indice]}.`,
      );
      break;
    }
  }

  const ultima = numeros.at(-1);
  if (ultima !== MIGRACION_MINIMA) {
    errores.push(
      `MIGRACION_MINIMA es ${MIGRACION_MINIMA} pero la última migración del repo es ${ultima}. Sincroniza lib/esquemaRequerido.js.`,
    );
  }

  return errores;
}

export function validarIndiceMigraciones(contenidoMd, archivos) {
  const errores = [];

  for (const archivo of archivos) {
    const numero = String(extraerNumeroMigracion(archivo)).padStart(3, "0");
    if (!contenidoMd.includes(`| ${numero} |`)) {
      errores.push(`MIGRATIONS.md no documenta la migración ${archivo}.`);
    }
  }

  return errores;
}

export function validarSchemaSql(contenidoSchema) {
  const errores = [];

  for (const rpc of RPCS_REQUERIDOS) {
    if (!contenidoSchema.includes(`function public.${rpc}`)) {
      errores.push(`schema.sql no define la RPC public.${rpc}.`);
    }
  }

  for (const tabla of TABLAS_REQUERIDAS) {
    if (!contenidoSchema.includes(`create table public.${tabla}`)) {
      errores.push(`schema.sql no define la tabla public.${tabla}.`);
    }
  }

  for (const politica of POLITICAS_REQUERIDAS) {
    if (!contenidoSchema.includes(`"${politica}"`)) {
      errores.push(`schema.sql no incluye la política RLS "${politica}".`);
    }
  }

  return errores;
}

export function verificarRepositorio(raizProyecto) {
  const directorioMigraciones = path.join(raizProyecto, "supabase", "migrations");
  const rutaIndice = path.join(raizProyecto, "supabase", "MIGRATIONS.md");
  const rutaSchema = path.join(raizProyecto, "supabase", "schema.sql");

  const archivos = listarMigraciones(directorioMigraciones);
  const contenidoMd = fs.readFileSync(rutaIndice, "utf8");
  const contenidoSchema = fs.readFileSync(rutaSchema, "utf8");

  return [
    ...validarSecuenciaMigraciones(archivos),
    ...validarIndiceMigraciones(contenidoMd, archivos),
    ...validarSchemaSql(contenidoSchema),
  ];
}
