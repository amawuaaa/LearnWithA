-- Aplica los niveles CEFR en la base de datos, no solo en la interfaz.
-- Los alumnos pueden ver que existe contenido bloqueado, pero sus preguntas,
-- descripciones y URLs no se entregan hasta alcanzar el nivel requerido.

create or replace function public.valor_nivel(p_nivel text)
returns integer
language sql
immutable
as $$
  select case p_nivel
    when 'A1' then 1
    when 'A2' then 2
    when 'B1' then 3
    when 'B2' then 4
    when 'C1' then 5
    else 1
  end;
$$;

create or replace view public.tests_alumno
with (security_invoker = false)
as
select
  t.id,
  t.titulo,
  t.nivel,
  t.creado_en,
  case
    when public.valor_nivel(t.nivel) <= coalesce((
      select public.valor_nivel(u.nivel)
      from public.usuarios u
      where u.id = auth.uid()
    ), 1)
    then (
      select jsonb_agg(pregunta - 'respuesta_correcta')
      from jsonb_array_elements(t.preguntas) as pregunta
    )
    else null
  end as preguntas
from public.tests t;

grant select on public.tests_alumno to authenticated;

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
  v_nivel_test text;
  v_nivel_usuario text;
  v_total integer;
  v_aciertos integer := 0;
  v_indice integer := 0;
  v_pregunta jsonb;
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

  insert into public.estudiantes_progreso (estudiante_id, test_id, puntuacion)
  values (auth.uid(), p_test_id, v_aciertos);

  return query select v_aciertos, v_total;
end;
$$;

revoke all on function public.enviar_resultado_test(uuid, jsonb) from public;
grant execute on function public.enviar_resultado_test(uuid, jsonb)
  to authenticated;

drop policy if exists "Usuarios autenticados pueden leer contenido"
  on public.contenido_didactico;

create policy "Admins pueden leer contenido completo"
on public.contenido_didactico
for select
to authenticated
using (public.es_admin());

create or replace view public.contenido_didactico_alumno
with (security_invoker = false)
as
select
  c.id,
  c.tipo,
  c.titulo,
  c.nivel,
  c.creado_en,
  case
    when c.nivel is null
      or public.valor_nivel(c.nivel) <= coalesce((
        select public.valor_nivel(u.nivel)
        from public.usuarios u
        where u.id = auth.uid()
      ), 1)
    then c.descripcion
    else null
  end as descripcion,
  case
    when c.nivel is null
      or public.valor_nivel(c.nivel) <= coalesce((
        select public.valor_nivel(u.nivel)
        from public.usuarios u
        where u.id = auth.uid()
      ), 1)
    then c.url
    else null
  end as url
from public.contenido_didactico c;

grant select on public.contenido_didactico_alumno to authenticated;
