-- La profesora obtiene un resumen por alumno sin descargar todo el historial.

create or replace function public.listar_conversaciones_chat()
returns table (
  estudiante_id uuid,
  nombre text,
  avatar_url text,
  ultimo_contenido text,
  ultimo_creado_en timestamptz,
  no_leidos bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede listar conversaciones.';
  end if;

  return query
  select
    estudiante.id,
    estudiante.nombre,
    estudiante.avatar_url,
    coalesce(
      nullif(trim(ultimo.contenido), ''),
      case when ultimo.id is not null then 'Archivo adjunto' end
    ),
    ultimo.creado_en,
    coalesce(pendientes.cantidad, 0)
  from public.usuarios as estudiante
  left join lateral (
    select
      mensaje.id,
      mensaje.contenido,
      mensaje.creado_en
    from public.mensajes as mensaje
    where mensaje.estudiante_id = estudiante.id
    order by mensaje.creado_en desc, mensaje.id desc
    limit 1
  ) as ultimo on true
  left join lateral (
    select count(*) as cantidad
    from public.mensajes as mensaje
    where mensaje.estudiante_id = estudiante.id
      and mensaje.remitente_id = estudiante.id
      and mensaje.leido_en is null
  ) as pendientes on true
  where estudiante.rol = 'estudiante'
  order by
    coalesce(pendientes.cantidad, 0) desc,
    ultimo.creado_en desc nulls last,
    estudiante.nombre;
end;
$$;

revoke all on function public.listar_conversaciones_chat() from public;
grant execute on function public.listar_conversaciones_chat()
  to authenticated;
