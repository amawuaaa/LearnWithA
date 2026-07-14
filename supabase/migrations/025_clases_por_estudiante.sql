-- Clases concretas por fecha, hora y alumno (sustituye el horario semanal global en la app).

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

create index clases_estudiante_fecha_idx
  on public.clases_estudiante (fecha);

create index clases_estudiante_estudiante_fecha_idx
  on public.clases_estudiante (estudiante_id, fecha);

alter table public.clases_estudiante enable row level security;

grant select, insert, update, delete on public.clases_estudiante to authenticated;

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

-- Copia el horario semanal anterior a clases concretas (próximas 8 semanas por alumno).
insert into public.clases_estudiante (estudiante_id, fecha, hora)
select
  u.id,
  d.fecha,
  h.hora
from public.usuarios u
cross join public.horario_clases h
cross join lateral (
  select (current_date + offs.offs)::date as fecha
  from generate_series(0, 55) as offs(offs)
) d
where u.rol = 'estudiante'
  and extract(dow from d.fecha)::smallint = h.dia_semana
  and not exists (
    select 1
    from public.clases_canceladas c
    where c.fecha = d.fecha
  )
on conflict (estudiante_id, fecha, hora) do nothing;
