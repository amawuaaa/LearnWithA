-- Adjuntos privados para el chat. Los archivos nunca son públicos:
-- Supabase genera enlaces temporales solo para los participantes autorizados.

alter table public.mensajes
  alter column contenido drop not null;

alter table public.mensajes
  drop constraint if exists mensajes_contenido_check;

alter table public.mensajes
  add column if not exists adjuntos jsonb not null default '[]'::jsonb;

alter table public.mensajes
  add constraint mensajes_contenido_longitud_check
  check (
    contenido is null
    or char_length(trim(contenido)) between 1 and 2000
  );

alter table public.mensajes
  add constraint mensajes_adjuntos_check
  check (
    case
      when jsonb_typeof(adjuntos) = 'array'
        then jsonb_array_length(adjuntos) <= 5
      else false
    end
  );

alter table public.mensajes
  add constraint mensajes_contenido_o_adjunto_check
  check (
    contenido is not null
    or case
      when jsonb_typeof(adjuntos) = 'array'
        then jsonb_array_length(adjuntos) > 0
      else false
    end
  );

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
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
