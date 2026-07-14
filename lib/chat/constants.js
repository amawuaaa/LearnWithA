export const SELECCION_MENSAJE =
  "*, remitente:usuarios!mensajes_remitente_id_fkey(nombre, avatar_url, rol)";

export const MAX_ARCHIVOS = 5;
export const MAX_TAMANO = 10 * 1024 * 1024;
export const TIPOS_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
