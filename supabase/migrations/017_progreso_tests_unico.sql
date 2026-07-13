-- Cada alumno conserva una sola fila por test: mejor nota, intentos acumulados
-- y fecha del intento más reciente.

alter table public.estudiantes_progreso
  add column if not exists intentos integer not null default 1
  check (intentos > 0);

with clasificados as (
  select
    id,
    row_number() over (
      partition by estudiante_id, test_id
      order by completado_en desc, id
    ) as posicion,
    count(*) over (
      partition by estudiante_id, test_id
    )::integer as total_intentos,
    max(puntuacion) over (
      partition by estudiante_id, test_id
    ) as mejor_puntuacion,
    max(completado_en) over (
      partition by estudiante_id, test_id
    ) as ultimo_intento
  from public.estudiantes_progreso
)
update public.estudiantes_progreso as progreso
set
  puntuacion = clasificados.mejor_puntuacion,
  intentos = clasificados.total_intentos,
  completado_en = clasificados.ultimo_intento
from clasificados
where progreso.id = clasificados.id
  and clasificados.posicion = 1;

with clasificados as (
  select
    id,
    row_number() over (
      partition by estudiante_id, test_id
      order by completado_en desc, id
    ) as posicion
  from public.estudiantes_progreso
)
delete from public.estudiantes_progreso as progreso
using clasificados
where progreso.id = clasificados.id
  and clasificados.posicion > 1;

alter table public.estudiantes_progreso
  add constraint estudiantes_progreso_estudiante_test_key
  unique (estudiante_id, test_id);

drop function if exists public.enviar_resultado_test(uuid, jsonb);

create function public.enviar_resultado_test(
  p_test_id uuid,
  p_respuestas jsonb
)
returns table (puntuacion integer, total integer, intentos integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preguntas jsonb;
  v_nivel_test text;
  v_nivel_usuario text;
  v_total integer;
  v_aciertos integer := 0;
  v_indice integer := 0;
  v_pregunta jsonb;
  v_intentos integer;
begin
  if public.es_admin() then
    raise exception 'Los administradores no pueden enviar resultados de test.';
  end if;

  select preguntas, nivel into v_preguntas, v_nivel_test
  from public.tests
  where id = p_test_id;

  if v_preguntas is null then
    raise exception 'Test no encontrado.';
  end if;

  select nivel into v_nivel_usuario
  from public.usuarios
  where id = auth.uid()
    and rol = 'estudiante';

  if v_nivel_usuario is null then
    raise exception 'Perfil de estudiante no encontrado.';
  end if;

  if public.valor_nivel(v_nivel_test) > public.valor_nivel(v_nivel_usuario) then
    raise exception 'Este test todavía no está desbloqueado.';
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

  insert into public.estudiantes_progreso (
    estudiante_id,
    test_id,
    puntuacion
  )
  values (auth.uid(), p_test_id, v_aciertos)
  on conflict (estudiante_id, test_id)
  do update set
    puntuacion = greatest(
      public.estudiantes_progreso.puntuacion,
      excluded.puntuacion
    ),
    intentos = public.estudiantes_progreso.intentos + 1,
    completado_en = now()
  returning estudiantes_progreso.intentos into v_intentos;

  return query select v_aciertos, v_total, v_intentos;
end;
$$;

revoke all on function public.enviar_resultado_test(uuid, jsonb) from public;
grant execute on function public.enviar_resultado_test(uuid, jsonb)
  to authenticated;
