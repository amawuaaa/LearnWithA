-- Ejecuta este archivo si ya aplicaste las migraciones anteriores.
-- Añade el horario recurrente de clases (por día de la semana) y las
-- cancelaciones puntuales, para la nueva sección de calendario.

create table public.horario_clases (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null unique check (dia_semana between 0 and 6),
  hora time,
  creado_en timestamptz not null default now()
);

create table public.clases_canceladas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  motivo text,
  creado_en timestamptz not null default now()
);

alter table public.horario_clases enable row level security;
alter table public.clases_canceladas enable row level security;

grant select, insert, update, delete on public.horario_clases to authenticated;
grant select, insert, update, delete on public.clases_canceladas to authenticated;

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
