-- Genera clases del mes para todos los alumnos (o uno) según su patrón semanal.

create or replace function public.generar_clases_mes(
  p_mes date,
  p_estudiante_id uuid default null
)
returns table (creadas integer, omitidas integer, sin_plantilla integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creadas integer := 0;
  v_total_slots integer := 0;
  v_sin_plantilla integer := 0;
  v_fin_mes date;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede generar clases.';
  end if;

  if extract(day from p_mes) <> 1 then
    raise exception 'El mes debe indicarse como el primer día (YYYY-MM-01).';
  end if;

  v_fin_mes := (p_mes + interval '1 month' - interval '1 day')::date;

  with estudiantes_filtrados as (
    select id
    from public.usuarios
    where rol = 'estudiante'
      and (p_estudiante_id is null or id = p_estudiante_id)
  ),
  plantilla_por_estudiante as (
    select
      e.id as estudiante_id,
      p.dia_semana,
      p.hora
    from estudiantes_filtrados e
    cross join lateral (
      select distinct
        extract(dow from c.fecha)::smallint as dia_semana,
        c.hora
      from public.clases_estudiante c
      where c.estudiante_id = e.id
        and c.cancelada = false
        and c.fecha >= (p_mes - interval '90 days')::date
        and c.fecha < p_mes
      union
      select h.dia_semana, h.hora
      from public.horario_clases h
      where not exists (
        select 1
        from public.clases_estudiante c2
        where c2.estudiante_id = e.id
          and c2.cancelada = false
          and c2.fecha >= (p_mes - interval '90 days')::date
          and c2.fecha < p_mes
      )
    ) p
  ),
  alumnos_sin_plantilla as (
    select e.id
    from estudiantes_filtrados e
    where not exists (
      select 1
      from plantilla_por_estudiante p
      where p.estudiante_id = e.id
    )
  ),
  dias_mes as (
    select d::date as fecha
    from generate_series(p_mes, v_fin_mes, interval '1 day') as d
  ),
  slots as (
    select
      p.estudiante_id,
      d.fecha,
      p.hora
    from plantilla_por_estudiante p
    cross join dias_mes d
    where extract(dow from d.fecha)::smallint = p.dia_semana
  ),
  insercion as (
    insert into public.clases_estudiante (estudiante_id, fecha, hora)
    select estudiante_id, fecha, hora
    from slots
    on conflict (estudiante_id, fecha, hora) do nothing
    returning 1
  )
  select
    (select count(*)::integer from slots),
    (select count(*)::integer from insercion),
    (select count(*)::integer from alumnos_sin_plantilla)
  into v_total_slots, v_creadas, v_sin_plantilla;

  return query
  select
    v_creadas,
    v_total_slots - v_creadas,
    v_sin_plantilla;
end;
$$;

revoke all on function public.generar_clases_mes(date, uuid) from public;
grant execute on function public.generar_clases_mes(date, uuid)
  to authenticated;
