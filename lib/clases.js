import { MIGRACION_MINIMA } from "./esquemaRequerido.js";

export function normalizarResultadoGeneracion(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export function mensajeErrorGeneracionClases(error) {
  if (!error) return "No se pudieron generar las clases.";

  const mensaje = error.message ?? "";

  if (
    error.code === "42501" ||
    mensaje.includes("row-level security") ||
    mensaje.includes("administrador")
  ) {
    return mensaje.includes("administrador")
      ? mensaje
      : "No tienes permisos para gestionar el calendario.";
  }

  if (mensaje.includes("primer día")) {
    return "Indica el mes como el primer día (por ejemplo, 2026-08-01).";
  }

  if (error.code === "42883" || error.code === "42P01") {
    const numero = String(MIGRACION_MINIMA).padStart(3, "0");
    return `La función generar_clases_mes no existe. Ejecuta la migración ${numero} en Supabase.`;
  }

  return mensaje || "No se pudieron generar las clases.";
}

export function mensajeExitoGeneracionClases({ creadas, omitidas, sinPlantilla }) {
  const partes = [];

  if (creadas > 0) {
    partes.push(
      creadas === 1
        ? "Se programó 1 clase nueva."
        : `Se programaron ${creadas} clases nuevas.`,
    );
  }

  if (omitidas > 0) {
    partes.push(
      omitidas === 1
        ? "1 horario ya existía."
        : `${omitidas} horarios ya existían.`,
    );
  }

  if (creadas === 0 && omitidas === 0) {
    partes.push("No había clases que generar para ese mes.");
  }

  if (sinPlantilla > 0) {
    partes.push(
      sinPlantilla === 1
        ? "1 alumno no tiene patrón semanal (programa al menos una semana manualmente)."
        : `${sinPlantilla} alumnos no tienen patrón semanal.`,
    );
  }

  return partes.join(" ");
}
