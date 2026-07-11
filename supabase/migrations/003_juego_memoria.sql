-- Ejecuta este archivo si ya aplicaste las migraciones anteriores.

create table if not exists public.juegos_memoria (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  pares jsonb not null
    check (jsonb_typeof(pares) = 'array'),
  creado_en timestamptz not null default now()
);

create table if not exists public.memoria_resultados (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.usuarios(id) on delete cascade,
  juego_id uuid not null references public.juegos_memoria(id) on delete cascade,
  intentos integer not null check (intentos >= 0),
  completado_en timestamptz not null default now()
);

create index if not exists memoria_resultados_estudiante_idx
  on public.memoria_resultados (estudiante_id);
create index if not exists memoria_resultados_juego_idx
  on public.memoria_resultados (juego_id);

alter table public.juegos_memoria enable row level security;
alter table public.memoria_resultados enable row level security;

grant select, insert, update, delete on public.juegos_memoria
  to authenticated;
grant select, insert on public.memoria_resultados to authenticated;

-- JUEGOS DE MEMORIA: lectura general y escritura exclusiva del admin.
drop policy if exists "Usuarios autenticados pueden leer juegos de memoria"
  on public.juegos_memoria;
create policy "Usuarios autenticados pueden leer juegos de memoria"
on public.juegos_memoria
for select
to authenticated
using (true);

drop policy if exists "Admins pueden crear juegos de memoria"
  on public.juegos_memoria;
create policy "Admins pueden crear juegos de memoria"
on public.juegos_memoria
for insert
to authenticated
with check (public.es_admin());

drop policy if exists "Admins pueden editar juegos de memoria"
  on public.juegos_memoria;
create policy "Admins pueden editar juegos de memoria"
on public.juegos_memoria
for update
to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "Admins pueden borrar juegos de memoria"
  on public.juegos_memoria;
create policy "Admins pueden borrar juegos de memoria"
on public.juegos_memoria
for delete
to authenticated
using (public.es_admin());

-- RESULTADOS DE MEMORIA: cada estudiante crea y lee lo suyo; el admin lee todo.
drop policy if exists "Estudiantes pueden leer sus resultados de memoria"
  on public.memoria_resultados;
create policy "Estudiantes pueden leer sus resultados de memoria"
on public.memoria_resultados
for select
to authenticated
using (estudiante_id = auth.uid());

drop policy if exists "Admins pueden leer todos los resultados de memoria"
  on public.memoria_resultados;
create policy "Admins pueden leer todos los resultados de memoria"
on public.memoria_resultados
for select
to authenticated
using (public.es_admin());

drop policy if exists "Estudiantes pueden guardar sus resultados de memoria"
  on public.memoria_resultados;
create policy "Estudiantes pueden guardar sus resultados de memoria"
on public.memoria_resultados
for insert
to authenticated
with check (
  estudiante_id = auth.uid()
  and not public.es_admin()
);
