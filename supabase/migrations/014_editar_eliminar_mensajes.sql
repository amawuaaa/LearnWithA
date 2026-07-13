-- Cada usuario puede editar o eliminar únicamente los mensajes que envió.

alter table public.mensajes
  add column if not exists editado_en timestamptz;

grant delete on public.mensajes to authenticated;

create policy "Autores pueden eliminar sus mensajes"
on public.mensajes
for delete
to authenticated
using (remitente_id = auth.uid());

create or replace function public.editar_mensaje(
  p_mensaje_id uuid,
  p_contenido text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_adjuntos jsonb;
  v_contenido text;
begin
  select adjuntos
  into v_adjuntos
  from public.mensajes
  where id = p_mensaje_id
    and remitente_id = auth.uid();

  if not found then
    raise exception 'Mensaje no encontrado o sin permiso para editarlo.';
  end if;

  v_contenido := nullif(trim(p_contenido), '');

  if v_contenido is not null and char_length(v_contenido) > 2000 then
    raise exception 'El mensaje supera los 2000 caracteres.';
  end if;

  if v_contenido is null and jsonb_array_length(v_adjuntos) = 0 then
    raise exception 'El mensaje no puede quedar vacío.';
  end if;

  update public.mensajes
  set
    contenido = v_contenido,
    editado_en = now()
  where id = p_mensaje_id;
end;
$$;

revoke all on function public.editar_mensaje(uuid, text) from public;
grant execute on function public.editar_mensaje(uuid, text) to authenticated;
