# Migraciones de Supabase

Este proyecto mantiene el esquema completo en `schema.sql` y el historial incremental en `supabase/migrations/`.

## Instalación nueva

Ejecuta una sola vez `supabase/schema.sql` en el editor SQL de Supabase.

## Proyecto existente

Aplica solo las migraciones que aún no hayas ejecutado, **en orden numérico**:

```bash
ls supabase/migrations/*.sql | sort
```

En el editor SQL de Supabase, abre cada archivo pendiente y ejecútalo. La tabla `supabase_migrations.schema_migrations` (si usas CLI) o tu propio registro manual te indican qué ya está aplicado.

## Índice

| # | Archivo | Descripción |
|---|---------|-------------|
| 001 | `001_perfiles_mensualidades.sql` | Perfiles de usuario y mensualidades (proyectos que partieron de un schema antiguo). |
| 002 | `002_fotos_perfil.sql` | Avatares en Storage y columna `avatar_url`. |
| 003 | `003_juego_memoria.sql` | Juegos de memoria y resultados por estudiante. |
| 004 | `004_niveles.sql` | Niveles CEFR en estudiantes, tests y vocabulario. |
| 005 | `005_tests_seguros.sql` | Vista `tests_alumno` sin respuestas correctas; calificación en servidor. |
| 006 | `006_calendario.sql` | Horario semanal (`horario_clases`) y cancelaciones puntuales. |
| 007 | `007_memoria_segura.sql` | Vista mezclada y RPC `comprobar_pareja_memoria`. |
| 008 | `008_progreso_tests_seguro.sql` | RPC `enviar_resultado_test` (nota calculada en servidor). |
| 009 | `009_niveles_admin_seguros.sql` | RPC `actualizar_nivel_estudiante` para el panel admin. |
| 010 | `010_niveles_backend.sql` | Filtrado de contenido por nivel en base de datos. |
| 011 | `011_codigos_registro.sql` | Códigos de registro renovables desde el panel. |
| 012 | `012_chat_privado.sql` | Chat privado alumno ↔ profesora. |
| 013 | `013_adjuntos_chat.sql` | Adjuntos en mensajes (Storage privado). |
| 014 | `014_editar_eliminar_mensajes.sql` | Edición y borrado de mensajes propios. |
| 015 | `015_lecciones_vocabulario.sql` | Lecciones temáticas y progreso individual. |
| 016 | `016_memoria_visual.sql` | Emojis en tarjetas de memoria y tiempo registrado. |
| 017 | `017_progreso_tests_unico.sql` | Una fila por test y alumno (mejor nota acumulada). |
| 018 | `018_chat_paginado.sql` | Resumen de conversaciones sin cargar todo el historial. |
| 019 | `019_limite_ia.sql` | Límite de 10 solicitudes IA por hora. |
| 020 | `020_limite_registro.sql` | Rate limit en intentos de registro. |
| 021 | `021_calendario_mejorado.sql` | Varias horas por día y eventos (exámenes / avisos). |
| 022 | `022_generar_mensualidades.sql` | RPC `generar_mensualidades_mes`. |
| 023 | `023_mensualidades_rpc.sql` | RPC `guardar_mensualidad_admin`. |
| 024 | `024_recrear_mensualidades.sql` | Repara tabla `mensualidades` si faltaba tras la 001. |
| 025 | `025_clases_por_estudiante.sql` | Tabla `clases_estudiante` + backfill 8 semanas. |
| 026 | `026_generar_clases_mes.sql` | RPC `generar_clases_mes` (extender calendario por mes). |
| 027 | `027_perfiles_visibles.sql` | Restringe lectura de perfiles: propio, admin y profesora. |

## RPC de administración

| Función | Uso |
|---------|-----|
| `generar_mensualidades_mes(periodo, importe, vencimiento)` | Crea mensualidades del mes para todos los alumnos. |
| `generar_clases_mes(mes, estudiante_id?)` | Genera clases del mes según el patrón semanal de cada alumno (últimos 90 días o `horario_clases` como respaldo). |
| `guardar_mensualidad_admin(...)` | Alta/edición puntual de una mensualidad. |
| `actualizar_nivel_estudiante(estudiante_id, nivel)` | Cambia el nivel CEFR de un alumno. |

## Sincronizar `schema.sql`

Tras añadir una migración nueva:

1. Incorpora tablas, índices, políticas RLS y funciones en `schema.sql`.
2. Añade la fila correspondiente en este documento.
3. Ejecuta la migración en Supabase (producción / staging).

La app asume que la base de datos está al día con la migración **027** como mínimo (privacidad de perfiles y calendario por alumno).

## Verificación automática

Antes de commit o en CI, ejecuta:

```bash
pnpm verify:migrations
```

Comprueba que la secuencia de `supabase/migrations/`, el índice de este documento y `schema.sql` están sincronizados con `lib/esquemaRequerido.js`.
