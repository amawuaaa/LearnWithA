-- Repara el caso en que la migración 001 quedó registrada pero la tabla no existe.

create table if not exists public.mensualidades (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  periodo date not null check (extract(day from periodo) = 1),
  importe numeric(10, 2) not null check (importe >= 0),
  fecha_vencimiento date not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'pagada', 'vencida')),
  creado_en timestamptz not null default now(),
  unique (estudiante_id, periodo)
);

create index if not exists mensualidades_estudiante_periodo_idx
  on public.mensualidades (estudiante_id, periodo desc);

alter table public.mensualidades enable row level security;

grant select, insert, update, delete on public.mensualidades to authenticated;

drop policy if exists "Estudiantes pueden leer sus mensualidades"
  on public.mensualidades;
create policy "Estudiantes pueden leer sus mensualidades"
on public.mensualidades
for select
to authenticated
using (estudiante_id = auth.uid());

drop policy if exists "Admins pueden leer mensualidades"
  on public.mensualidades;
create policy "Admins pueden leer mensualidades"
on public.mensualidades
for select
to authenticated
using (public.es_admin());

drop policy if exists "Admins pueden crear mensualidades"
  on public.mensualidades;
create policy "Admins pueden crear mensualidades"
on public.mensualidades
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "Admins pueden editar mensualidades"
  on public.mensualidades;
create policy "Admins pueden editar mensualidades"
on public.mensualidades
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "Admins pueden borrar mensualidades"
  on public.mensualidades;
create policy "Admins pueden borrar mensualidades"
on public.mensualidades
for delete
to authenticated
using (public.es_admin());

create or replace function public.generar_mensualidades_mes(
  p_periodo date,
  p_importe numeric,
  p_fecha_vencimiento date
)
returns table (creadas integer, omitidas integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creadas integer := 0;
  v_total integer := 0;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede generar mensualidades.';
  end if;

  if extract(day from p_periodo) <> 1 then
    raise exception 'El periodo debe ser el primer día del mes.';
  end if;

  if p_importe < 0 then
    raise exception 'El importe no puede ser negativo.';
  end if;

  select count(*)::integer
  into v_total
  from public.usuarios
  where rol = 'estudiante';

  insert into public.mensualidades (
    estudiante_id,
    periodo,
    importe,
    fecha_vencimiento,
    estado
  )
  select
    id,
    p_periodo,
    p_importe,
    p_fecha_vencimiento,
    'pendiente'
  from public.usuarios
  where rol = 'estudiante'
  on conflict (estudiante_id, periodo) do nothing;

  get diagnostics v_creadas = row_count;

  return query select v_creadas, v_total - v_creadas;
end;
$$;

create or replace function public.guardar_mensualidad_admin(
  p_estudiante_id uuid,
  p_periodo date,
  p_importe numeric,
  p_fecha_vencimiento date,
  p_estado text,
  p_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede gestionar mensualidades.';
  end if;

  if extract(day from p_periodo) <> 1 then
    raise exception 'El periodo debe ser el primer día del mes.';
  end if;

  if p_importe < 0 then
    raise exception 'El importe no puede ser negativo.';
  end if;

  if p_estado not in ('pendiente', 'pagada', 'vencida') then
    raise exception 'Estado no válido.';
  end if;

  if not exists (
    select 1
    from public.usuarios
    where id = p_estudiante_id
      and rol = 'estudiante'
  ) then
    raise exception 'El alumno seleccionado no es válido.';
  end if;

  if p_id is null then
    insert into public.mensualidades (
      estudiante_id,
      periodo,
      importe,
      fecha_vencimiento,
      estado
    )
    values (
      p_estudiante_id,
      p_periodo,
      p_importe,
      p_fecha_vencimiento,
      p_estado
    )
    returning id into v_id;
  else
    update public.mensualidades
    set
      estudiante_id = p_estudiante_id,
      periodo = p_periodo,
      importe = p_importe,
      fecha_vencimiento = p_fecha_vencimiento,
      estado = p_estado
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'No se encontró la mensualidad a editar.';
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.generar_mensualidades_mes(date, numeric, date) from public;
grant execute on function public.generar_mensualidades_mes(date, numeric, date)
  to authenticated;

revoke all on function public.guardar_mensualidad_admin(
  uuid, date, numeric, date, text, uuid
) from public;
grant execute on function public.guardar_mensualidad_admin(
  uuid, date, numeric, date, text, uuid
) to authenticated;
