-- Chat privado: cada alumno conversa únicamente con la profesora.

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null,
  remitente_id uuid not null,
  contenido text not null
    check (char_length(trim(contenido)) between 1 and 2000),
  leido_en timestamptz,
  creado_en timestamptz not null default now(),
  constraint mensajes_estudiante_id_fkey
    foreign key (estudiante_id) references public.usuarios(id)
    on delete cascade,
  constraint mensajes_remitente_id_fkey
    foreign key (remitente_id) references public.usuarios(id)
    on delete cascade
);

create index if not exists mensajes_estudiante_fecha_idx
  on public.mensajes (estudiante_id, creado_en);
create index if not exists mensajes_no_leidos_idx
  on public.mensajes (estudiante_id, creado_en)
  where leido_en is null;

alter table public.mensajes enable row level security;

grant select, insert on public.mensajes to authenticated;
grant update (leido_en) on public.mensajes to authenticated;

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

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mensajes'
  ) then
    alter publication supabase_realtime add table public.mensajes;
  end if;
end;
$$;
