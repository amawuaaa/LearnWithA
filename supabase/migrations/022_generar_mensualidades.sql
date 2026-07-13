-- Genera mensualidades del mes para todos los estudiantes de una vez.

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

revoke all on function public.generar_mensualidades_mes(date, numeric, date) from public;
grant execute on function public.generar_mensualidades_mes(date, numeric, date)
  to authenticated;
