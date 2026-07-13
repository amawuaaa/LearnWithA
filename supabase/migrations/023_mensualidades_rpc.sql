-- Guarda mensualidades desde el panel admin evitando bloqueos de RLS.

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

revoke all on function public.guardar_mensualidad_admin(
  uuid, date, numeric, date, text, uuid
) from public;
grant execute on function public.guardar_mensualidad_admin(
  uuid, date, numeric, date, text, uuid
) to authenticated;
