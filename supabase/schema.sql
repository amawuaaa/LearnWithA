-- Esquema inicial de Portal de Clase.
-- Ejecutar completo desde el editor SQL de un proyecto nuevo de Supabase.

create extension if not exists "pgcrypto";

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  avatar_url text,
  rol text not null default 'estudiante'
    check (rol in ('admin', 'estudiante')),
  creado_en timestamptz not null default now()
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
  creado_en timestamptz not null default now()
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  preguntas jsonb not null
    check (jsonb_typeof(preguntas) = 'array'),
  creado_en timestamptz not null default now()
);

create table public.estudiantes_progreso (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  puntuacion integer not null check (puntuacion >= 0),
  completado_en timestamptz not null default now()
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

create index anuncios_creado_en_idx
  on public.anuncios (creado_en desc);
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

alter table public.usuarios enable row level security;
alter table public.anuncios enable row level security;
alter table public.contenido_didactico enable row level security;
alter table public.tests enable row level security;
alter table public.estudiantes_progreso enable row level security;
alter table public.juegos_memoria enable row level security;
alter table public.memoria_resultados enable row level security;
alter table public.mensualidades enable row level security;

-- Permisos de tabla; las políticas RLS limitan después cada operación.
grant select on public.usuarios to authenticated;
grant update (nombre, avatar_url) on public.usuarios to authenticated;
grant select, insert, update, delete on public.anuncios to authenticated;
grant select, insert, update, delete on public.contenido_didactico
  to authenticated;
grant select, insert, update, delete on public.tests to authenticated;
grant select, insert on public.estudiantes_progreso to authenticated;
grant select, insert, update, delete on public.juegos_memoria to authenticated;
grant select, insert on public.memoria_resultados to authenticated;
grant select, insert, update, delete on public.mensualidades to authenticated;

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

-- CONTENIDO DIDÁCTICO: lectura general y escritura exclusiva del admin.
create policy "Usuarios autenticados pueden leer contenido"
on public.contenido_didactico
for select
to authenticated
using (true);

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

-- TESTS: lectura general y escritura exclusiva del admin.
create policy "Usuarios autenticados pueden leer tests"
on public.tests
for select
to authenticated
using (true);

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

-- PROGRESO: cada estudiante crea y lee lo suyo; el admin lee todo.
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

create policy "Estudiantes pueden guardar su progreso"
on public.estudiantes_progreso
for insert
to authenticated
with check (
  estudiante_id = auth.uid()
  and not public.es_admin()
);

-- JUEGOS DE MEMORIA: lectura general y escritura exclusiva del admin.
create policy "Usuarios autenticados pueden leer juegos de memoria"
on public.juegos_memoria
for select
to authenticated
using (true);

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

-- Supabase Realtime emitirá los cambios del muro de anuncios.
alter publication supabase_realtime add table public.anuncios;

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
