-- Ejecuta este archivo si ya aplicaste las migraciones anteriores.

alter table public.usuarios
  add column if not exists avatar_url text;

grant update (avatar_url) on public.usuarios to authenticated;

-- Esta política se incluye aquí también para que la migración sea autónoma,
-- aunque no se haya ejecutado previamente la migración de mensualidades.
drop policy if exists "Usuarios pueden editar su nombre" on public.usuarios;
drop policy if exists "Usuarios pueden editar su perfil" on public.usuarios;
create policy "Usuarios pueden editar su perfil"
on public.usuarios
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

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
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuarios pueden leer su avatar" on storage.objects;
create policy "Usuarios pueden leer su avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden subir su avatar" on storage.objects;
create policy "Usuarios pueden subir su avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Usuarios pueden reemplazar su avatar"
  on storage.objects;
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

drop policy if exists "Usuarios pueden borrar su avatar" on storage.objects;
create policy "Usuarios pueden borrar su avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatares'
  and (storage.foldername(name))[1] = auth.uid()::text
);
