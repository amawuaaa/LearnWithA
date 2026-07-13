export const estilosEstadoMensualidad = {
  pagada: "bg-emerald-50 text-emerald-700",
  pendiente: "bg-amber-50 text-amber-700",
  vencida: "bg-red-50 text-red-700",
};

export function mensajeErrorMensualidad(error) {
  if (!error) return "No se pudo guardar la mensualidad.";

  const mensaje = error.message ?? "";

  if (error.code === "23505" || mensaje.includes("duplicate key")) {
    return "Este alumno ya tiene una mensualidad para ese mes.";
  }

  if (
    error.code === "42501" ||
    mensaje.includes("row-level security") ||
    mensaje.includes("administrador")
  ) {
    return mensaje.includes("administrador")
      ? mensaje
      : "No tienes permisos para gestionar mensualidades. Comprueba que tu cuenta sea de administrador.";
  }

  if (error.code === "23503" || mensaje.includes("alumno seleccionado")) {
    return "El alumno seleccionado no es válido. Regístralo primero como estudiante.";
  }

  if (error.code === "42P01") {
    return "La tabla de mensualidades no existe. Aplica las migraciones de Supabase.";
  }

  if (error.code === "PGRST202" || error.code === "42883") {
    return "La función de mensualidades no está disponible. Ejecuta: pnpm exec supabase db push";
  }

  if (error.code === "22P02") {
    return "Algún dato del formulario no es válido.";
  }

  if (mensaje.includes("violates check")) {
    return "Revisa el importe y las fechas del formulario.";
  }

  return mensaje || "No se pudo guardar la mensualidad.";
}

export function mensajeExitoGeneracion({ creadas, omitidas, total }) {
  if (total === 0) {
    return "No hay alumnos registrados. Primero deben crear su cuenta con el código de clase.";
  }

  if (creadas === 0 && omitidas > 0) {
    return `Ninguna mensualidad nueva: los ${omitidas} alumnos ya tenían ese mes registrado.`;
  }

  if (creadas === 0) {
    return "No se creó ninguna mensualidad. Revisa los datos e inténtalo de nuevo.";
  }

  const detalle =
    omitidas > 0
      ? ` ${omitidas} alumnos ya tenían ese mes y se omitieron.`
      : "";

  return `Se crearon ${creadas} mensualidades.${detalle}`;
}
