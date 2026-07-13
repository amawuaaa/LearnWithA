-- Sustituye el código guardado en .env por un código corto que la profesora
-- puede generar y renovar desde su panel.

create table if not exists public.codigos_registro (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (char_length(codigo) = 6),
  activo boolean not null default true,
  creado_por uuid not null references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create unique index if not exists codigos_registro_un_activo_idx
  on public.codigos_registro (activo)
  where activo = true;

alter table public.codigos_registro enable row level security;

grant select on public.codigos_registro to authenticated;

drop policy if exists "Admins pueden leer códigos de registro"
  on public.codigos_registro;
create policy "Admins pueden leer códigos de registro"
on public.codigos_registro
for select
to authenticated
using (public.es_admin());

create or replace function public.generar_codigo_registro()
returns table (codigo text, creado_en timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_creado_en timestamptz;
  v_uuid uuid;
  v_indice integer;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede generar códigos.';
  end if;

  -- Evita que dos administradores generen códigos activos a la vez.
  perform pg_catalog.pg_advisory_xact_lock(72190411);

  update public.codigos_registro
  set activo = false
  where activo = true;

  loop
    v_codigo := '';
    v_uuid := pg_catalog.gen_random_uuid();

    for v_indice in 0..5 loop
      v_codigo := v_codigo || substr(
        v_alfabeto,
        (pg_catalog.get_byte(pg_catalog.uuid_send(v_uuid), v_indice)
          % char_length(v_alfabeto)) + 1,
        1
      );
    end loop;

    begin
      insert into public.codigos_registro (codigo, creado_por)
      values (v_codigo, auth.uid())
      returning codigos_registro.creado_en into v_creado_en;
      exit;
    exception
      when unique_violation then
        -- La posibilidad de repetir uno anterior es mínima; se genera otro.
        null;
    end;
  end loop;

  return query select v_codigo, v_creado_en;
end;
$$;

revoke all on function public.generar_codigo_registro() from public;
grant execute on function public.generar_codigo_registro() to authenticated;

create or replace function public.codigo_registro_valido(p_codigo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.codigos_registro
    where activo = true
      and codigo = upper(trim(p_codigo))
  );
$$;

revoke all on function public.codigo_registro_valido(text) from public;
grant execute on function public.codigo_registro_valido(text)
  to anon, authenticated;
