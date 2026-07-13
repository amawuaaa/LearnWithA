-- Ejecuta este archivo si ya aplicaste las migraciones anteriores.
-- Antes, "select * from tests" era legible por cualquier autenticado, así
-- que la respuesta_correcta de cada pregunta viajaba al navegador de los
-- alumnos incluso antes de contestar. Ahora:
--   - Los alumnos leen la vista tests_alumno, que no incluye respuesta_correcta.
--   - Solo el admin puede leer la tabla tests completa.
--   - La calificación se calcula en el servidor con enviar_resultado_test,
--     para que el cliente nunca reciba las respuestas correctas.

drop policy if exists "Usuarios autenticados pueden leer tests" on public.tests;

create policy "Admins pueden leer tests completos"
on public.tests
for select
to authenticated
using (public.es_admin());

-- La vista corre con los permisos de su dueño (igual que una función
-- security definer), así que puede leer public.tests aunque la política de
-- arriba restrinja el acceso directo a los admins.
create or replace view public.tests_alumno as
select
  t.id,
  t.titulo,
  t.nivel,
  t.creado_en,
  (
    select jsonb_agg(pregunta - 'respuesta_correcta')
    from jsonb_array_elements(t.preguntas) as pregunta
  ) as preguntas
from public.tests t;

grant select on public.tests_alumno to authenticated;

-- Califica un test en el servidor: recibe las respuestas del alumno,
-- las compara con las respuestas correctas (que nunca salen del servidor)
-- y guarda el resultado en estudiantes_progreso.
create or replace function public.enviar_resultado_test(
  p_test_id uuid,
  p_respuestas jsonb
)
returns table (puntuacion integer, total integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preguntas jsonb;
  v_total integer;
  v_aciertos integer := 0;
  v_indice integer := 0;
  v_pregunta jsonb;
begin
  if public.es_admin() then
    raise exception 'Los administradores no pueden enviar resultados de test.';
  end if;

  select preguntas into v_preguntas
  from public.tests
  where id = p_test_id;

  if v_preguntas is null then
    raise exception 'Test no encontrado.';
  end if;

  v_total := jsonb_array_length(v_preguntas);

  if jsonb_typeof(p_respuestas) is distinct from 'object'
    or (select count(*) from jsonb_object_keys(p_respuestas)) <> v_total
  then
    raise exception 'Debes responder todas las preguntas.';
  end if;

  for v_pregunta in select * from jsonb_array_elements(v_preguntas)
  loop
    if p_respuestas ->> v_indice::text = v_pregunta ->> 'respuesta_correcta' then
      v_aciertos := v_aciertos + 1;
    end if;
    v_indice := v_indice + 1;
  end loop;

  insert into public.estudiantes_progreso (estudiante_id, test_id, puntuacion)
  values (auth.uid(), p_test_id, v_aciertos);

  return query select v_aciertos, v_total;
end;
$$;

revoke all on function public.enviar_resultado_test(uuid, jsonb) from public;
grant execute on function public.enviar_resultado_test(uuid, jsonb) to authenticated;
