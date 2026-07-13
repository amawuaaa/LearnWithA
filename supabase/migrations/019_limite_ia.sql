-- Limita el uso conjunto de los generadores de IA a 10 solicitudes por hora.

create table public.solicitudes_ia (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  creado_en timestamptz not null default now()
);

create index solicitudes_ia_usuario_fecha_idx
  on public.solicitudes_ia (usuario_id, creado_en desc);

alter table public.solicitudes_ia enable row level security;

revoke all on public.solicitudes_ia from anon, authenticated;

create or replace function public.consumir_cupo_ia()
returns table (permitido boolean, restantes integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_usadas integer;
  v_limite constant integer := 10;
begin
  if v_usuario_id is null or not public.es_admin() then
    raise exception 'Solo un administrador puede usar los generadores de IA.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_usuario_id::text)
  );

  delete from public.solicitudes_ia
  where creado_en < now() - interval '24 hours';

  select count(*)::integer
  into v_usadas
  from public.solicitudes_ia
  where usuario_id = v_usuario_id
    and creado_en >= now() - interval '1 hour';

  if v_usadas >= v_limite then
    return query select false, 0;
    return;
  end if;

  insert into public.solicitudes_ia (usuario_id)
  values (v_usuario_id);

  return query select true, v_limite - v_usadas - 1;
end;
$$;

revoke all on function public.consumir_cupo_ia() from public;
grant execute on function public.consumir_cupo_ia() to authenticated;
