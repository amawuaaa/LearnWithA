-- Esquema inicial de Portal de Clase.
-- Ejecutar completo desde el editor SQL de un proyecto nuevo de Supabase.

create extension if not exists "pgcrypto";

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  avatar_url text,
  rol text not null default 'estudiante'
    check (rol in ('admin', 'estudiante')),
  nivel text not null default 'A1'
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1')),
  creado_en timestamptz not null default now()
);

create table public.codigos_registro (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (char_length(codigo) = 6),
  activo boolean not null default true,
  creado_por uuid not null references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create table public.solicitudes_ia (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table public.intentos_registro (
  id uuid primary key default gen_random_uuid(),
  clave text not null,
  creado_en timestamptz not null default now()
);

create unique index codigos_registro_un_activo_idx
  on public.codigos_registro (activo)
  where activo = true;

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null,
  remitente_id uuid not null,
  contenido text
    check (
      contenido is null
      or char_length(trim(contenido)) between 1 and 2000
    ),
  adjuntos jsonb not null default '[]'::jsonb
    check (
      case
        when jsonb_typeof(adjuntos) = 'array'
          then jsonb_array_length(adjuntos) <= 5
        else false
      end
    ),
  leido_en timestamptz,
  editado_en timestamptz,
  creado_en timestamptz not null default now(),
  check (
    contenido is not null
    or case
      when jsonb_typeof(adjuntos) = 'array'
        then jsonb_array_length(adjuntos) > 0
      else false
    end
  ),
  constraint mensajes_estudiante_id_fkey
    foreign key (estudiante_id) references public.usuarios(id)
    on delete cascade,
  constraint mensajes_remitente_id_fkey
    foreign key (remitente_id) references public.usuarios(id)
    on delete cascade
);

create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text not null,
  autor_id uuid not null references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create table public.contenido_didactico (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('vocabulario', 'verbo', 'juego')),
  titulo text not null,
  descripcion text not null,
  url text,
  nivel text check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1')),
  creado_en timestamptz not null default now()
);

create table public.lecciones_vocabulario (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  tema text not null check (char_length(trim(tema)) between 1 and 80),
  descripcion text not null check (
    char_length(trim(descripcion)) between 1 and 500
  ),
  nivel text not null default 'A1'
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1')),
  palabras jsonb not null check (
    case
      when jsonb_typeof(palabras) = 'array'
        then jsonb_array_length(palabras) between 4 and 20
      else false
    end
  ),
  ejercicios jsonb not null check (
    case
      when jsonb_typeof(ejercicios) = 'array'
        then jsonb_array_length(ejercicios) between 1 and 20
      else false
    end
  ),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.lecciones_vocabulario_progreso (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  leccion_id uuid not null
    references public.lecciones_vocabulario(id) on delete cascade,
  puntuacion integer not null check (puntuacion >= 0),
  total integer not null check (total > 0 and puntuacion <= total),
  intentos integer not null default 1 check (intentos > 0),
  completado_en timestamptz not null default now(),
  unique (estudiante_id, leccion_id)
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  preguntas jsonb not null
    check (jsonb_typeof(preguntas) = 'array'),
  nivel text not null default 'A1'
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1')),
  creado_en timestamptz not null default now()
);

create table public.estudiantes_progreso (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  puntuacion integer not null check (puntuacion >= 0),
  intentos integer not null default 1 check (intentos > 0),
  completado_en timestamptz not null default now(),
  unique (estudiante_id, test_id)
);

create table public.juegos_memoria (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  pares jsonb not null
    check (jsonb_typeof(pares) = 'array'),
  creado_en timestamptz not null default now()
);

create table public.memoria_resultados (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  juego_id uuid not null references public.juegos_memoria(id) on delete cascade,
  intentos integer not null check (intentos >= 0),
  duracion_segundos integer check (duracion_segundos > 0),
  completado_en timestamptz not null default now()
);

create table public.mensualidades (
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

create table public.horario_clases (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora time not null default '18:00'::time,
  creado_en timestamptz not null default now()
);

create table public.clases_canceladas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  motivo text,
  creado_en timestamptz not null default now()
);

create table public.eventos_calendario (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('examen', 'anuncio')),
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  descripcion text
    check (
      descripcion is null
      or char_length(trim(descripcion)) between 1 and 500
    ),
  creado_por uuid not null references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create table public.clases_estudiante (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  fecha date not null,
  hora time not null default '18:00'::time,
  cancelada boolean not null default false,
  motivo_cancelacion text,
  creado_en timestamptz not null default now(),
  constraint clases_estudiante_estudiante_fecha_hora_key
    unique (estudiante_id, fecha, hora)
);

create unique index horario_clases_dia_hora_idx
  on public.horario_clases (dia_semana, hora);
create index eventos_calendario_fecha_idx
  on public.eventos_calendario (fecha);

create index clases_estudiante_fecha_idx
  on public.clases_estudiante (fecha);

create index clases_estudiante_estudiante_fecha_idx
  on public.clases_estudiante (estudiante_id, fecha);

create index anuncios_creado_en_idx
  on public.anuncios (creado_en desc);
create index mensajes_estudiante_fecha_idx
  on public.mensajes (estudiante_id, creado_en);
create index mensajes_no_leidos_idx
  on public.mensajes (estudiante_id, creado_en)
  where leido_en is null;
create index solicitudes_ia_usuario_fecha_idx
  on public.solicitudes_ia (usuario_id, creado_en desc);
create index intentos_registro_clave_fecha_idx
  on public.intentos_registro (clave, creado_en desc);
create index lecciones_vocabulario_nivel_idx
  on public.lecciones_vocabulario (nivel, creado_en desc);
create index lecciones_vocabulario_progreso_estudiante_idx
  on public.lecciones_vocabulario_progreso (estudiante_id);
create index contenido_didactico_tipo_idx
  on public.contenido_didactico (tipo);
create index estudiantes_progreso_estudiante_idx
  on public.estudiantes_progreso (estudiante_id);
create index estudiantes_progreso_test_idx
  on public.estudiantes_progreso (test_id);
create index memoria_resultados_estudiante_idx
  on public.memoria_resultados (estudiante_id);
create index memoria_resultados_juego_idx
  on public.memoria_resultados (juego_id);
create index mensualidades_estudiante_periodo_idx
  on public.mensualidades (estudiante_id, periodo desc);

-- Los perfiles se crean automáticamente. El rol siempre empieza como
-- estudiante; el primer admin debe promoverse desde el editor SQL.
create or replace function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (id, nombre, rol)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Estudiante'
    ),
    'estudiante'
  );

  return new;
end;
$$;

create trigger al_crear_usuario_auth
  after insert on auth.users
  for each row execute procedure public.crear_perfil_de_usuario();

revoke all on function public.crear_perfil_de_usuario() from public;

-- También crea perfiles para cuentas que ya existían al aplicar el esquema.
insert into public.usuarios (id, nombre, rol)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'nombre', ''),
    nullif(split_part(coalesce(email, ''), '@', 1), ''),
    'Estudiante'
  ),
  'estudiante'
from auth.users
on conflict (id) do nothing;

-- Esta función evita recursión RLS al consultar el rol desde las políticas.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid() and rol = 'admin'
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

create or replace function public.valor_nivel(p_nivel text)
returns integer
language sql
immutable
as $$
  select case p_nivel
    when 'A1' then 1
    when 'A2' then 2
    when 'B1' then 3
    when 'B2' then 4
    when 'C1' then 5
    else 1
  end;
$$;

-- El admin cambia niveles mediante esta función; nadie recibe UPDATE directo
-- sobre la columna nivel.
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

revoke all on function public.generar_mensualidades_mes(date, numeric, date)
  from public;
grant execute on function public.generar_mensualidades_mes(date, numeric, date)
  to authenticated;

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

alter table public.usuarios enable row level security;
alter table public.codigos_registro enable row level security;
alter table public.solicitudes_ia enable row level security;
alter table public.intentos_registro enable row level security;
alter table public.mensajes enable row level security;
alter table public.anuncios enable row level security;
alter table public.contenido_didactico enable row level security;
alter table public.lecciones_vocabulario enable row level security;
alter table public.lecciones_vocabulario_progreso enable row level security;
alter table public.tests enable row level security;
alter table public.estudiantes_progreso enable row level security;
alter table public.juegos_memoria enable row level security;
alter table public.memoria_resultados enable row level security;
alter table public.mensualidades enable row level security;
alter table public.horario_clases enable row level security;
alter table public.clases_canceladas enable row level security;
alter table public.eventos_calendario enable row level security;
alter table public.clases_estudiante enable row level security;

-- Permisos de tabla; las políticas RLS limitan después cada operación.
grant select on public.usuarios to authenticated;
grant update (nombre, avatar_url) on public.usuarios to authenticated;
grant select on public.codigos_registro to authenticated;
revoke all on public.solicitudes_ia from anon, authenticated;
revoke all on public.intentos_registro from anon, authenticated;
grant select, insert on public.mensajes to authenticated;
grant update (leido_en) on public.mensajes to authenticated;
grant delete on public.mensajes to authenticated;
grant select, insert, update, delete on public.anuncios to authenticated;
grant select, insert, update, delete on public.contenido_didactico
  to authenticated;
grant select, insert, update, delete on public.lecciones_vocabulario
  to authenticated;
grant select on public.lecciones_vocabulario_progreso to authenticated;
grant select, insert, update, delete on public.tests to authenticated;
grant select on public.estudiantes_progreso to authenticated;
grant select, insert, update, delete on public.juegos_memoria to authenticated;
grant select, insert on public.memoria_resultados to authenticated;
grant select, insert, update, delete on public.mensualidades to authenticated;
grant select, insert, update, delete on public.horario_clases to authenticated;
grant select, insert, update, delete on public.clases_canceladas
  to authenticated;
grant select, insert, update, delete on public.eventos_calendario
  to authenticated;
grant select, insert, update, delete on public.clases_estudiante
  to authenticated;

-- USUARIOS: los autenticados pueden resolver nombres y roles.
create policy "Usuarios autenticados pueden leer perfiles"
on public.usuarios
for select
to authenticated
using (true);

create policy "Usuarios pueden editar su perfil"
on public.usuarios
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins pueden leer códigos de registro"
on public.codigos_registro
for select
to authenticated
using (public.es_admin());

-- MENSAJES: conversación privada entre cada estudiante y la profesora.
create policy "Usuarios pueden leer sus conversaciones"
on public.mensajes
for select
to authenticated
using (
  estudiante_id = auth.uid()
  or public.es_admin()
);

create policy "Usuarios pueden enviar mensajes"
on public.mensajes
for insert
to authenticated
with check (
  remitente_id = auth.uid()
  and (
    (
      estudiante_id = auth.uid()
      and exists (
        select 1
        from public.usuarios
        where id = auth.uid() and rol = 'estudiante'
      )
    )
    or (
      public.es_admin()
      and exists (
        select 1
        from public.usuarios
        where id = estudiante_id and rol = 'estudiante'
      )
    )
  )
);

create policy "Destinatarios pueden marcar mensajes leídos"
on public.mensajes
for update
to authenticated
using (
  (
    estudiante_id = auth.uid()
    and remitente_id <> auth.uid()
  )
  or (
    public.es_admin()
    and remitente_id = estudiante_id
  )
)
with check (
  (
    estudiante_id = auth.uid()
    and remitente_id <> auth.uid()
  )
  or (
    public.es_admin()
    and remitente_id = estudiante_id
  )
);

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

-- ANUNCIOS: lectura general autenticada y escritura exclusiva del admin.
create policy "Usuarios autenticados pueden leer anuncios"
on public.anuncios
for select
to authenticated
using (true);

create policy "Admins pueden crear anuncios"
on public.anuncios
for insert
to authenticated
with check (public.es_admin() and autor_id = auth.uid());

create policy "Admins pueden editar anuncios"
on public.anuncios
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar anuncios"
on public.anuncios
for delete
to authenticated
using (public.es_admin());

-- CONTENIDO DIDÁCTICO: el admin lee la tabla completa. Los alumnos usan la
-- vista filtrada contenido_didactico_alumno, definida más abajo.
create policy "Admins pueden leer contenido completo"
on public.contenido_didactico
for select
to authenticated
using (public.es_admin());

create policy "Admins pueden crear contenido"
on public.contenido_didactico
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden editar contenido"
on public.contenido_didactico
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar contenido"
on public.contenido_didactico
for delete
to authenticated
using (public.es_admin());

create or replace view public.contenido_didactico_alumno
with (security_invoker = false)
as
select
  c.id,
  c.tipo,
  c.titulo,
  c.nivel,
  c.creado_en,
  case
    when c.nivel is null
      or public.valor_nivel(c.nivel) <= coalesce((
        select public.valor_nivel(u.nivel)
        from public.usuarios u
        where u.id = auth.uid()
      ), 1)
    then c.descripcion
    else null
  end as descripcion,
  case
    when c.nivel is null
      or public.valor_nivel(c.nivel) <= coalesce((
        select public.valor_nivel(u.nivel)
        from public.usuarios u
        where u.id = auth.uid()
      ), 1)
    then c.url
    else null
  end as url
from public.contenido_didactico c;

grant select on public.contenido_didactico_alumno to authenticated;

-- LECCIONES DE VOCABULARIO: el contenido desbloqueado se expone sin respuestas.
create policy "Admins gestionan lecciones de vocabulario"
on public.lecciones_vocabulario
for all
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Estudiantes leen su progreso de vocabulario"
on public.lecciones_vocabulario_progreso
for select
to authenticated
using (
  estudiante_id = auth.uid()
  or public.es_admin()
);

create view public.lecciones_vocabulario_alumno
with (security_invoker = false)
as
select
  leccion.id,
  leccion.titulo,
  leccion.tema,
  leccion.descripcion,
  leccion.nivel,
  leccion.creado_en,
  case
    when public.valor_nivel(leccion.nivel) <= public.valor_nivel(
      coalesce(
        (
          select usuario.nivel
          from public.usuarios as usuario
          where usuario.id = auth.uid()
        ),
        'A1'
      )
    )
    then leccion.palabras
    else null
  end as palabras,
  case
    when public.valor_nivel(leccion.nivel) <= public.valor_nivel(
      coalesce(
        (
          select usuario.nivel
          from public.usuarios as usuario
          where usuario.id = auth.uid()
        ),
        'A1'
      )
    )
    then (
      select coalesce(
        jsonb_agg(ejercicio - 'respuesta_correcta'),
        '[]'::jsonb
      )
      from jsonb_array_elements(leccion.ejercicios) as ejercicio
    )
    else null
  end as ejercicios
from public.lecciones_vocabulario as leccion;

grant select on public.lecciones_vocabulario_alumno to authenticated;

create or replace function public.enviar_resultado_leccion_vocabulario(
  p_leccion_id uuid,
  p_respuestas jsonb
)
returns table (puntuacion integer, total integer, intentos integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ejercicios jsonb;
  v_nivel_leccion text;
  v_nivel_estudiante text;
  v_puntuacion integer := 0;
  v_total integer;
  v_indice integer;
  v_intentos integer;
begin
  if auth.uid() is null or public.es_admin() then
    raise exception 'Solo los estudiantes pueden completar lecciones.';
  end if;

  if jsonb_typeof(p_respuestas) is distinct from 'object' then
    raise exception 'Las respuestas no son válidas.';
  end if;

  select leccion.ejercicios, leccion.nivel
  into v_ejercicios, v_nivel_leccion
  from public.lecciones_vocabulario as leccion
  where leccion.id = p_leccion_id;

  if not found then
    raise exception 'Lección no encontrada.';
  end if;

  select usuario.nivel
  into v_nivel_estudiante
  from public.usuarios as usuario
  where usuario.id = auth.uid()
    and usuario.rol = 'estudiante';

  if not found then
    raise exception 'Perfil de estudiante no encontrado.';
  end if;

  if public.valor_nivel(v_nivel_leccion)
    > public.valor_nivel(v_nivel_estudiante) then
    raise exception 'Esta lección todavía está bloqueada.';
  end if;

  v_total := jsonb_array_length(v_ejercicios);

  for v_indice in 0..(v_total - 1) loop
    if p_respuestas ->> v_indice::text
      = v_ejercicios -> v_indice ->> 'respuesta_correcta' then
      v_puntuacion := v_puntuacion + 1;
    end if;
  end loop;

  insert into public.lecciones_vocabulario_progreso (
    estudiante_id,
    leccion_id,
    puntuacion,
    total
  )
  values (
    auth.uid(),
    p_leccion_id,
    v_puntuacion,
    v_total
  )
  on conflict (estudiante_id, leccion_id)
  do update set
    puntuacion = excluded.puntuacion,
    total = excluded.total,
    intentos = public.lecciones_vocabulario_progreso.intentos + 1,
    completado_en = now()
  returning lecciones_vocabulario_progreso.intentos into v_intentos;

  return query select v_puntuacion, v_total, v_intentos;
end;
$$;

revoke all on function public.enviar_resultado_leccion_vocabulario(uuid, jsonb)
  from public;
grant execute
  on function public.enviar_resultado_leccion_vocabulario(uuid, jsonb)
  to authenticated;

-- TESTS: solo el admin lee la tabla completa (incluye respuesta_correcta).
-- Los alumnos leen la vista public.tests_alumno, definida más abajo, que no
-- incluye las respuestas correctas.
create policy "Admins pueden leer tests completos"
on public.tests
for select
to authenticated
using (public.es_admin());

create policy "Admins pueden crear tests"
on public.tests
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden editar tests"
on public.tests
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar tests"
on public.tests
for delete
to authenticated
using (public.es_admin());

-- Los tests bloqueados conservan título y nivel, pero no entregan preguntas.
create or replace view public.tests_alumno
with (security_invoker = false)
as
select
  t.id,
  t.titulo,
  t.nivel,
  t.creado_en,
  case
    when public.valor_nivel(t.nivel) <= coalesce((
      select public.valor_nivel(u.nivel)
      from public.usuarios u
      where u.id = auth.uid()
    ), 1)
    then (
      select jsonb_agg(pregunta - 'respuesta_correcta')
      from jsonb_array_elements(t.preguntas) as pregunta
    )
    else null
  end as preguntas
from public.tests t;

grant select on public.tests_alumno to authenticated;

-- Califica un test en el servidor: recibe las respuestas del alumno, las
-- compara con las respuestas correctas (que nunca salen del servidor) y
-- guarda el resultado en estudiantes_progreso.
create or replace function public.enviar_resultado_test(
  p_test_id uuid,
  p_respuestas jsonb
)
returns table (puntuacion integer, total integer, intentos integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_preguntas jsonb;
  v_nivel_test text;
  v_nivel_usuario text;
  v_total integer;
  v_aciertos integer := 0;
  v_indice integer := 0;
  v_pregunta jsonb;
  v_intentos integer;
begin
  if public.es_admin() then
    raise exception 'Los administradores no pueden enviar resultados de test.';
  end if;

  select preguntas, nivel into v_preguntas, v_nivel_test
  from public.tests
  where id = p_test_id;

  if v_preguntas is null then
    raise exception 'Test no encontrado.';
  end if;

  select nivel into v_nivel_usuario
  from public.usuarios
  where id = auth.uid()
    and rol = 'estudiante';

  if v_nivel_usuario is null then
    raise exception 'Perfil de estudiante no encontrado.';
  end if;

  if public.valor_nivel(v_nivel_test) > public.valor_nivel(v_nivel_usuario) then
    raise exception 'Este test todavía no está desbloqueado.';
  end if;

  v_total := jsonb_array_length(v_preguntas);

  if jsonb_typeof(p_respuestas) is distinct from 'object'
    or (select count(*) from jsonb_object_keys(p_respuestas)) <> v_total
  then
    raise exception 'Debes responder todas las preguntas.';
  end if;

  for v_pregunta in select * from jsonb_array_elements(v_preguntas)
  loop
    if p_respuestas ->> v_indice::text = v_pregunta ->> 'respuesta_correcta' then
      v_aciertos := v_aciertos + 1;
    end if;
    v_indice := v_indice + 1;
  end loop;

  insert into public.estudiantes_progreso (
    estudiante_id,
    test_id,
    puntuacion
  )
  values (auth.uid(), p_test_id, v_aciertos)
  on conflict (estudiante_id, test_id)
  do update set
    puntuacion = greatest(
      public.estudiantes_progreso.puntuacion,
      excluded.puntuacion
    ),
    intentos = public.estudiantes_progreso.intentos + 1,
    completado_en = now()
  returning estudiantes_progreso.intentos into v_intentos;

  return query select v_aciertos, v_total, v_intentos;
end;
$$;

revoke all on function public.enviar_resultado_test(uuid, jsonb) from public;
grant execute on function public.enviar_resultado_test(uuid, jsonb) to authenticated;

-- PROGRESO: cada estudiante lee lo suyo y el admin lee todo.
-- Solo enviar_resultado_test puede insertar puntuaciones.
create policy "Estudiantes pueden leer su progreso"
on public.estudiantes_progreso
for select
to authenticated
using (estudiante_id = auth.uid());

create policy "Admins pueden leer todo el progreso"
on public.estudiantes_progreso
for select
to authenticated
using (public.es_admin());

-- JUEGOS DE MEMORIA: solo el admin lee la tabla completa (incluye las
-- parejas). Los alumnos leen la vista public.juegos_memoria_alumno,
-- definida más abajo, que no revela qué carta hace pareja con cuál.
create policy "Admins pueden leer juegos de memoria completos"
on public.juegos_memoria
for select
to authenticated
using (public.es_admin());

create policy "Admins pueden crear juegos de memoria"
on public.juegos_memoria
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden editar juegos de memoria"
on public.juegos_memoria
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar juegos de memoria"
on public.juegos_memoria
for delete
to authenticated
using (public.es_admin());

-- La vista corre con los permisos de su dueño, así que puede leer
-- public.juegos_memoria aunque la política de arriba restrinja el acceso
-- directo a los admins.
create or replace view public.juegos_memoria_alumno
with (security_invoker = false)
as
select
  juego.id,
  juego.titulo,
  juego.creado_en,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', gen_random_uuid(),
        'texto', carta.texto,
        'emoji', carta.emoji,
        'tipo', carta.tipo
      )
      order by random()
    )
    from (
      select
        par ->> 'termino' as texto,
        null::text as emoji,
        'termino'::text as tipo
      from jsonb_array_elements(juego.pares) as par
      union all
      select
        par ->> 'pareja' as texto,
        nullif(par ->> 'emoji', '') as emoji,
        'pareja'::text as tipo
      from jsonb_array_elements(juego.pares) as par
    ) as carta
  ) as cartas
from public.juegos_memoria as juego;

grant select on public.juegos_memoria_alumno to authenticated;

-- Verifica si dos textos de cartas hacen pareja, sin exponer el resto de
-- las parejas del juego.
create or replace function public.comprobar_pareja_memoria(
  p_juego_id uuid,
  p_texto_a text,
  p_texto_b text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from jsonb_array_elements(
      (select pares from public.juegos_memoria where id = p_juego_id)
    ) as par
    where (par ->> 'termino' = p_texto_a and par ->> 'pareja' = p_texto_b)
       or (par ->> 'termino' = p_texto_b and par ->> 'pareja' = p_texto_a)
  );
$$;

revoke all on function public.comprobar_pareja_memoria(uuid, text, text)
  from public;
grant execute on function public.comprobar_pareja_memoria(uuid, text, text)
  to authenticated;

-- RESULTADOS DE MEMORIA: cada estudiante crea y lee lo suyo; el admin lee todo.
create policy "Estudiantes pueden leer sus resultados de memoria"
on public.memoria_resultados
for select
to authenticated
using (estudiante_id = auth.uid());

create policy "Admins pueden leer todos los resultados de memoria"
on public.memoria_resultados
for select
to authenticated
using (public.es_admin());

create policy "Estudiantes pueden guardar sus resultados de memoria"
on public.memoria_resultados
for insert
to authenticated
with check (
  estudiante_id = auth.uid()
  and not public.es_admin()
);

-- MENSUALIDADES: cada estudiante consulta las suyas; el admin las gestiona.
create policy "Estudiantes pueden leer sus mensualidades"
on public.mensualidades
for select
to authenticated
using (estudiante_id = auth.uid());

create policy "Admins pueden leer mensualidades"
on public.mensualidades
for select
to authenticated
using (public.es_admin());

create policy "Admins pueden crear mensualidades"
on public.mensualidades
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden editar mensualidades"
on public.mensualidades
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar mensualidades"
on public.mensualidades
for delete
to authenticated
using (public.es_admin());

-- HORARIO: lectura general y escritura exclusiva del admin.
create policy "Usuarios autenticados pueden leer el horario"
on public.horario_clases
for select
to authenticated
using (true);

create policy "Admins pueden crear días de horario"
on public.horario_clases
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden editar días de horario"
on public.horario_clases
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar días de horario"
on public.horario_clases
for delete
to authenticated
using (public.es_admin());

-- CANCELACIONES: lectura general y escritura exclusiva del admin.
create policy "Usuarios autenticados pueden leer cancelaciones"
on public.clases_canceladas
for select
to authenticated
using (true);

create policy "Admins pueden crear cancelaciones"
on public.clases_canceladas
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden borrar cancelaciones"
on public.clases_canceladas
for delete
to authenticated
using (public.es_admin());

create policy "Usuarios leen clases permitidas"
on public.clases_estudiante
for select
to authenticated
using (estudiante_id = auth.uid() or public.es_admin());

create policy "Admins crean clases"
on public.clases_estudiante
for insert
to authenticated
with check (public.es_admin());

create policy "Admins actualizan clases"
on public.clases_estudiante
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins borran clases"
on public.clases_estudiante
for delete
to authenticated
using (public.es_admin());

create policy "Usuarios autenticados pueden leer eventos del calendario"
on public.eventos_calendario
for select
to authenticated
using (true);

create policy "Admins pueden crear eventos del calendario"
on public.eventos_calendario
for insert
to authenticated
with check (public.es_admin());

create policy "Admins pueden editar eventos del calendario"
on public.eventos_calendario
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

create policy "Admins pueden borrar eventos del calendario"
on public.eventos_calendario
for delete
to authenticated
using (public.es_admin());

-- Supabase Realtime emitirá los cambios del muro de anuncios.
alter publication supabase_realtime add table public.anuncios;
alter publication supabase_realtime add table public.mensajes;

-- Fotos de perfil públicas, con escritura limitada a la carpeta de cada usuario.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatares',
  'avatares',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Usuarios pueden leer su avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuarios pueden subir su avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuarios pueden reemplazar su avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Usuarios pueden borrar su avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Archivos privados del chat, con un máximo de 10 MB por archivo.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'archivos_chat',
  'archivos_chat',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

create policy "Participantes pueden leer archivos del chat"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'archivos_chat'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.es_admin()
  )
);

create policy "Participantes pueden subir archivos al chat"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'archivos_chat'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (
      public.es_admin()
      and exists (
        select 1
        from public.usuarios
        where id::text = (storage.foldername(name))[1]
          and rol = 'estudiante'
      )
    )
  )
);

create policy "Autores pueden borrar archivos del chat"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'archivos_chat'
  and (storage.foldername(name))[2] = auth.uid()::text
);
