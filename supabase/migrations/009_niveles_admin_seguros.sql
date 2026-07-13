-- Permite que el admin cambie el nivel de un estudiante sin conceder
-- UPDATE directo sobre la columna nivel a todos los usuarios autenticados.

create or replace function public.actualizar_nivel_estudiante(
  p_estudiante_id uuid,
  p_nivel text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede cambiar niveles.';
  end if;

  if p_nivel not in ('A1', 'A2', 'B1', 'B2', 'C1') then
    raise exception 'Nivel no válido.';
  end if;

  update public.usuarios
  set nivel = p_nivel
  where id = p_estudiante_id
    and rol = 'estudiante';

  if not found then
    raise exception 'Estudiante no encontrado.';
  end if;
end;
$$;

revoke all on function public.actualizar_nivel_estudiante(uuid, text)
  from public;
grant execute on function public.actualizar_nivel_estudiante(uuid, text)
  to authenticated;
