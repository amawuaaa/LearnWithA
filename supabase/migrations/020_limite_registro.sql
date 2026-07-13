-- Frena intentos masivos de registro y fuerza bruta sobre el código de clase.

create table public.intentos_registro (
  id uuid primary key default gen_random_uuid(),
  clave text not null,
  creado_en timestamptz not null default now()
);

create index intentos_registro_clave_fecha_idx
  on public.intentos_registro (clave, creado_en desc);

alter table public.intentos_registro enable row level security;

revoke all on public.intentos_registro from anon, authenticated;

create or replace function public.consumir_cupo_registro(
  p_ip text,
  p_email text
)
returns table (permitido boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := nullif(trim(p_ip), '');
  v_email text := lower(nullif(trim(p_email), ''));
  v_limite_ip constant integer := 8;
  v_limite_email constant integer := 4;
  v_usos_ip integer := 0;
  v_usos_email integer := 0;
begin
  if v_ip is null and v_email is null then
    return query select false;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(72190412);

  delete from public.intentos_registro
  where creado_en < now() - interval '24 hours';

  if v_ip is not null then
    select count(*)::integer
    into v_usos_ip
    from public.intentos_registro
    where clave = 'ip:' || v_ip
      and creado_en >= now() - interval '1 hour';
  end if;

  if v_email is not null then
    select count(*)::integer
    into v_usos_email
    from public.intentos_registro
    where clave = 'email:' || v_email
      and creado_en >= now() - interval '1 hour';
  end if;

  if v_usos_ip >= v_limite_ip or v_usos_email >= v_limite_email then
    return query select false;
    return;
  end if;

  if v_ip is not null then
    insert into public.intentos_registro (clave)
    values ('ip:' || v_ip);
  end if;

  if v_email is not null then
    insert into public.intentos_registro (clave)
    values ('email:' || v_email);
  end if;

  return query select true;
end;
$$;

revoke all on function public.consumir_cupo_registro(text, text) from public;
grant execute on function public.consumir_cupo_registro(text, text)
  to anon, authenticated;
