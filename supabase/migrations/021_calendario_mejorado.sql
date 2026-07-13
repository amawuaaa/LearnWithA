-- Varias horas por día de la semana y eventos (exámenes / anuncios) en fechas concretas.

alter table public.horario_clases
  drop constraint if exists horario_clases_dia_semana_key;

update public.horario_clases
set hora = '18:00'::time
where hora is null;

alter table public.horario_clases
  alter column hora set default '18:00'::time,
  alter column hora set not null;

create unique index if not exists horario_clases_dia_hora_idx
  on public.horario_clases (dia_semana, hora);

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

create index eventos_calendario_fecha_idx
  on public.eventos_calendario (fecha);

alter table public.eventos_calendario enable row level security;

grant select, insert, update, delete on public.eventos_calendario to authenticated;

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
