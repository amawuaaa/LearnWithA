-- Impide que un alumno inserte manualmente una puntuación arbitraria.
-- Los resultados solo se guardan desde enviar_resultado_test, que calcula
-- la nota en el servidor y se ejecuta como SECURITY DEFINER.

revoke insert on public.estudiantes_progreso from authenticated;

drop policy if exists "Estudiantes pueden guardar su progreso"
  on public.estudiantes_progreso;
