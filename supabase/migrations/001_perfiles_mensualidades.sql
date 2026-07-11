-- Ejecuta este archivo si ya aplicaste schema.sql antes de añadir los perfiles.

create table if not exists public.mensualidades (
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

create index if not exists mensualidades_estudiante_periodo_idx
  on public.mensualidades (estudiante_id, periodo desc);

alter table public.mensualidades enable row level security;

grant update (nombre) on public.usuarios to authenticated;
grant select, insert, update, delete on public.mensualidades to authenticated;

drop policy if exists "Usuarios pueden editar su nombre" on public.usuarios;
create policy "Usuarios pueden editar su nombre"
on public.usuarios
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Estudiantes pueden leer sus mensualidades"
  on public.mensualidades;
create policy "Estudiantes pueden leer sus mensualidades"
on public.mensualidades
for select
to authenticated
using (estudiante_id = auth.uid());

drop policy if exists "Admins pueden leer mensualidades"
  on public.mensualidades;
create policy "Admins pueden leer mensualidades"
on public.mensualidades
for select
to authenticated
using (public.es_admin());

drop policy if exists "Admins pueden crear mensualidades"
  on public.mensualidades;
create policy "Admins pueden crear mensualidades"
on public.mensualidades
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "Admins pueden editar mensualidades"
  on public.mensualidades;
create policy "Admins pueden editar mensualidades"
on public.mensualidades
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "Admins pueden borrar mensualidades"
  on public.mensualidades;
create policy "Admins pueden borrar mensualidades"
on public.mensualidades
for delete
to authenticated
using (public.es_admin());
