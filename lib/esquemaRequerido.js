/** Última migración que la app asume aplicada en Supabase. */
export const MIGRACION_MINIMA = 28;

/** RPCs que el frontend o las API routes invocan directamente. */
export const RPCS_REQUERIDOS = [
  "generar_clases_mes",
  "generar_mensualidades_mes",
  "guardar_mensualidad_admin",
  "guardar_asignaciones_contenido",
  "actualizar_nivel_estudiante",
  "enviar_resultado_test",
  "enviar_resultado_leccion_vocabulario",
  "comprobar_pareja_memoria",
  "listar_conversaciones_chat",
  "editar_mensaje",
  "codigo_registro_valido",
  "generar_codigo_registro",
  "consumir_cupo_ia",
  "consumir_cupo_registro",
];

/** Tablas centrales referenciadas por la app. */
export const TABLAS_REQUERIDAS = [
  "usuarios",
  "clases_estudiante",
  "mensajes",
  "anuncios",
  "tests",
  "lecciones_vocabulario",
  "asignaciones_contenido",
  "juegos_memoria",
  "mensualidades",
  "solicitudes_ia",
  "intentos_registro",
];

/** Políticas RLS clave que deben existir en schema.sql. */
export const POLITICAS_REQUERIDAS = [
  "Usuarios pueden leer perfiles visibles",
  "Admins pueden leer tests completos",
  "Admins pueden leer juegos de memoria completos",
  "Usuarios pueden leer sus conversaciones",
  "Usuarios autenticados pueden leer anuncios",
];
