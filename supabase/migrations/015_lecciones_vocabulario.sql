-- Lecciones temáticas de vocabulario con práctica y progreso individual.

create table public.lecciones_vocabulario (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  tema text not null check (char_length(trim(tema)) between 1 and 80),
  descripcion text not null check (
    char_length(trim(descripcion)) between 1 and 500
  ),
  nivel text not null default 'A1'
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1')),
  palabras jsonb not null check (
    case
      when jsonb_typeof(palabras) = 'array'
        then jsonb_array_length(palabras) between 4 and 20
      else false
    end
  ),
  ejercicios jsonb not null check (
    case
      when jsonb_typeof(ejercicios) = 'array'
        then jsonb_array_length(ejercicios) between 1 and 20
      else false
    end
  ),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.lecciones_vocabulario_progreso (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  leccion_id uuid not null
    references public.lecciones_vocabulario(id) on delete cascade,
  puntuacion integer not null check (puntuacion >= 0),
  total integer not null check (total > 0 and puntuacion <= total),
  intentos integer not null default 1 check (intentos > 0),
  completado_en timestamptz not null default now(),
  unique (estudiante_id, leccion_id)
);

create index lecciones_vocabulario_nivel_idx
  on public.lecciones_vocabulario (nivel, creado_en desc);
create index lecciones_vocabulario_progreso_estudiante_idx
  on public.lecciones_vocabulario_progreso (estudiante_id);

alter table public.lecciones_vocabulario enable row level security;
alter table public.lecciones_vocabulario_progreso enable row level security;

grant select, insert, update, delete
  on public.lecciones_vocabulario to authenticated;
grant select on public.lecciones_vocabulario_progreso to authenticated;

create policy "Admins gestionan lecciones de vocabulario"
on public.lecciones_vocabulario
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Estudiantes leen su progreso de vocabulario"
on public.lecciones_vocabulario_progreso
for select
to authenticated
using (
  estudiante_id = auth.uid()
  or public.es_admin()
);

create view public.lecciones_vocabulario_alumno
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
    then (
      select coalesce(
        jsonb_agg(ejercicio - 'respuesta_correcta'),
        '[]'::jsonb
      )
      from jsonb_array_elements(leccion.ejercicios) as ejercicio
    )
    else null
  end as ejercicios
from public.lecciones_vocabulario as leccion;

grant select on public.lecciones_vocabulario_alumno to authenticated;

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

  if public.valor_nivel(v_nivel_leccion)
    > public.valor_nivel(v_nivel_estudiante) then
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
