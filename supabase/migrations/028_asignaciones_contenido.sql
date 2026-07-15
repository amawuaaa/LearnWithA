-- Asignación de tests y lecciones de vocabulario a alumnos concretos.
-- El contenido sigue siendo del catálogo global; la asignación desbloquea
-- el acceso aunque el nivel CEFR del alumno sea inferior.

create table if not exists public.asignaciones_contenido (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios (id) on delete cascade,
  tipo text not null check (tipo in ('test', 'leccion_vocabulario')),
  test_id uuid references public.tests (id) on delete cascade,
  leccion_id uuid references public.lecciones_vocabulario (id) on delete cascade,
  asignado_por uuid references public.usuarios (id) on delete set null,
  asignado_en timestamptz not null default now(),
  constraint asignaciones_contenido_destino_chk check (
    (
      tipo = 'test'
      and test_id is not null
      and leccion_id is null
    )
    or (
      tipo = 'leccion_vocabulario'
      and leccion_id is not null
      and test_id is null
    )
  )
);

create unique index if not exists asignaciones_contenido_test_uidx
  on public.asignaciones_contenido (estudiante_id, test_id)
  where test_id is not null;

create unique index if not exists asignaciones_contenido_leccion_uidx
  on public.asignaciones_contenido (estudiante_id, leccion_id)
  where leccion_id is not null;

create index if not exists asignaciones_contenido_test_idx
  on public.asignaciones_contenido (test_id)
  where test_id is not null;

create index if not exists asignaciones_contenido_leccion_idx
  on public.asignaciones_contenido (leccion_id)
  where leccion_id is not null;

alter table public.asignaciones_contenido enable row level security;

drop policy if exists "Alumnos y admin leen asignaciones"
  on public.asignaciones_contenido;
create policy "Alumnos y admin leen asignaciones"
on public.asignaciones_contenido
for select
to authenticated
using (
  estudiante_id = auth.uid()
  or public.es_admin()
);

drop policy if exists "Admins gestionan asignaciones"
  on public.asignaciones_contenido;
create policy "Admins gestionan asignaciones"
on public.asignaciones_contenido
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

-- Sustituye la lista de alumnos asignados a un test o lección.
create or replace function public.guardar_asignaciones_contenido(
  p_tipo text,
  p_test_id uuid,
  p_leccion_id uuid,
  p_estudiante_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[] := coalesce(p_estudiante_ids, '{}'::uuid[]);
  v_total integer;
begin
  if not public.es_admin() then
    raise exception 'Solo la administradora puede asignar contenido.';
  end if;

  if p_tipo = 'test' then
    if p_test_id is null or p_leccion_id is not null then
      raise exception 'Asignación de test inválida.';
    end if;
    if not exists (select 1 from public.tests where id = p_test_id) then
      raise exception 'Test no encontrado.';
    end if;

    delete from public.asignaciones_contenido
    where test_id = p_test_id;

    insert into public.asignaciones_contenido (
      estudiante_id,
      tipo,
      test_id,
      asignado_por
    )
    select
      estudiante.id,
      'test',
      p_test_id,
      auth.uid()
    from public.usuarios as estudiante
    where estudiante.id = any (v_ids)
      and estudiante.rol = 'estudiante';

  elsif p_tipo = 'leccion_vocabulario' then
    if p_leccion_id is null or p_test_id is not null then
      raise exception 'Asignación de lección inválida.';
    end if;
    if not exists (
      select 1 from public.lecciones_vocabulario where id = p_leccion_id
    ) then
      raise exception 'Lección no encontrada.';
    end if;

    delete from public.asignaciones_contenido
    where leccion_id = p_leccion_id;

    insert into public.asignaciones_contenido (
      estudiante_id,
      tipo,
      leccion_id,
      asignado_por
    )
    select
      estudiante.id,
      'leccion_vocabulario',
      p_leccion_id,
      auth.uid()
    from public.usuarios as estudiante
    where estudiante.id = any (v_ids)
      and estudiante.rol = 'estudiante';
  else
    raise exception 'Tipo de asignación no válido.';
  end if;

  select count(*)::integer into v_total
  from public.asignaciones_contenido
  where (
    p_tipo = 'test'
    and test_id = p_test_id
  )
  or (
    p_tipo = 'leccion_vocabulario'
    and leccion_id = p_leccion_id
  );

  return v_total;
end;
$$;

revoke all on function public.guardar_asignaciones_contenido(text, uuid, uuid, uuid[])
  from public;
grant execute on function public.guardar_asignaciones_contenido(text, uuid, uuid, uuid[])
  to authenticated;

-- asignado va al final: CREATE OR REPLACE no puede renombrar/reordenar columnas.
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
    or exists (
      select 1
      from public.asignaciones_contenido as asignacion
      where asignacion.estudiante_id = auth.uid()
        and asignacion.test_id = t.id
    )
    then (
      select jsonb_agg(pregunta - 'respuesta_correcta')
      from jsonb_array_elements(t.preguntas) as pregunta
    )
    else null
  end as preguntas,
  exists (
    select 1
    from public.asignaciones_contenido as asignacion
    where asignacion.estudiante_id = auth.uid()
      and asignacion.test_id = t.id
  ) as asignado
from public.tests t;

grant select on public.tests_alumno to authenticated;

create or replace view public.lecciones_vocabulario_alumno
with (security_invoker = false)
as
select
  leccion.id,
  leccion.titulo,
  leccion.tema,
  leccion.descripcion,
  leccion.nivel,
  leccion.creado_en,
  case
    when public.valor_nivel(leccion.nivel) <= public.valor_nivel(
      coalesce(
        (
          select usuario.nivel
          from public.usuarios as usuario
          where usuario.id = auth.uid()
        ),
        'A1'
      )
    )
    or exists (
      select 1
      from public.asignaciones_contenido as asignacion
      where asignacion.estudiante_id = auth.uid()
        and asignacion.leccion_id = leccion.id
    )
    then leccion.palabras
    else null
  end as palabras,
  case
    when public.valor_nivel(leccion.nivel) <= public.valor_nivel(
      coalesce(
        (
          select usuario.nivel
          from public.usuarios as usuario
          where usuario.id = auth.uid()
        ),
        'A1'
      )
    )
    or exists (
      select 1
      from public.asignaciones_contenido as asignacion
      where asignacion.estudiante_id = auth.uid()
        and asignacion.leccion_id = leccion.id
    )
    then (
      select coalesce(
        jsonb_agg(ejercicio - 'respuesta_correcta'),
        '[]'::jsonb
      )
      from jsonb_array_elements(leccion.ejercicios) as ejercicio
    )
    else null
  end as ejercicios,
  exists (
    select 1
    from public.asignaciones_contenido as asignacion
    where asignacion.estudiante_id = auth.uid()
      and asignacion.leccion_id = leccion.id
  ) as asignado
from public.lecciones_vocabulario as leccion;

grant select on public.lecciones_vocabulario_alumno to authenticated;

create or replace function public.enviar_resultado_test(
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
  v_asignado boolean;
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

  select exists (
    select 1
    from public.asignaciones_contenido as asignacion
    where asignacion.estudiante_id = auth.uid()
      and asignacion.test_id = p_test_id
  ) into v_asignado;

  if public.valor_nivel(v_nivel_test) > public.valor_nivel(v_nivel_usuario)
    and not v_asignado
  then
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

create or replace function public.enviar_resultado_leccion_vocabulario(
  p_leccion_id uuid,
  p_respuestas jsonb
)
returns table (puntuacion integer, total integer, intentos integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ejercicios jsonb;
  v_nivel_leccion text;
  v_nivel_estudiante text;
  v_asignado boolean;
  v_puntuacion integer := 0;
  v_total integer;
  v_indice integer;
  v_intentos integer;
begin
  if auth.uid() is null or public.es_admin() then
    raise exception 'Solo los estudiantes pueden completar lecciones.';
  end if;

  if jsonb_typeof(p_respuestas) is distinct from 'object' then
    raise exception 'Las respuestas no son válidas.';
  end if;

  select leccion.ejercicios, leccion.nivel
  into v_ejercicios, v_nivel_leccion
  from public.lecciones_vocabulario as leccion
  where leccion.id = p_leccion_id;

  if not found then
    raise exception 'Lección no encontrada.';
  end if;

  select usuario.nivel
  into v_nivel_estudiante
  from public.usuarios as usuario
  where usuario.id = auth.uid()
    and usuario.rol = 'estudiante';

  if not found then
    raise exception 'Perfil de estudiante no encontrado.';
  end if;

  select exists (
    select 1
    from public.asignaciones_contenido as asignacion
    where asignacion.estudiante_id = auth.uid()
      and asignacion.leccion_id = p_leccion_id
  ) into v_asignado;

  if public.valor_nivel(v_nivel_leccion)
    > public.valor_nivel(v_nivel_estudiante)
    and not v_asignado
  then
    raise exception 'Esta lección todavía está bloqueada.';
  end if;

  v_total := jsonb_array_length(v_ejercicios);

  for v_indice in 0..(v_total - 1) loop
    if p_respuestas ->> v_indice::text
      = v_ejercicios -> v_indice ->> 'respuesta_correcta' then
      v_puntuacion := v_puntuacion + 1;
    end if;
  end loop;

  insert into public.lecciones_vocabulario_progreso (
    estudiante_id,
    leccion_id,
    puntuacion,
    total
  )
  values (
    auth.uid(),
    p_leccion_id,
    v_puntuacion,
    v_total
  )
  on conflict (estudiante_id, leccion_id)
  do update set
    puntuacion = excluded.puntuacion,
    total = excluded.total,
    intentos = public.lecciones_vocabulario_progreso.intentos + 1,
    completado_en = now()
  returning lecciones_vocabulario_progreso.intentos into v_intentos;

  return query select v_puntuacion, v_total, v_intentos;
end;
$$;

revoke all on function public.enviar_resultado_leccion_vocabulario(uuid, jsonb)
  from public;
grant execute
  on function public.enviar_resultado_leccion_vocabulario(uuid, jsonb)
  to authenticated;
