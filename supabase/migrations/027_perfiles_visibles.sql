-- Restringe la lectura de perfiles: cada usuario ve el suyo y los de admin;
-- la profesora (admin) sigue viendo todos los alumnos.

drop policy if exists "Usuarios autenticados pueden leer perfiles" on public.usuarios;

create policy "Usuarios pueden leer perfiles visibles"
on public.usuarios
for select
to authenticated
using (
  id = auth.uid()
  or public.es_admin()
  or rol = 'admin'
);
