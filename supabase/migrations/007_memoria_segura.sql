-- Ejecuta este archivo si ya aplicaste las migraciones anteriores.
-- Antes, "select * from juegos_memoria" era legible por cualquier
-- autenticado, así que las parejas completas (qué término va con qué
-- traducción) viajaban al navegador del alumno antes de jugar. Ahora:
--   - Los alumnos leen la vista juegos_memoria_alumno, que devuelve las
--     tarjetas ya mezcladas y sin agrupar (no se puede saber qué carta
--     hace pareja con cuál solo mirando el payload).
--   - Comprobar si dos cartas hacen pareja se hace en el servidor con
--     comprobar_pareja_memoria, así el cliente nunca recibe la lista de
--     parejas completa.

drop policy if exists "Usuarios autenticados pueden leer juegos de memoria"
  on public.juegos_memoria;

create policy "Admins pueden leer juegos de memoria completos"
on public.juegos_memoria
for select
to authenticated
using (public.es_admin());

-- La vista corre con los permisos de su dueño, así que puede leer
-- public.juegos_memoria aunque la política de arriba restrinja el acceso
-- directo a los admins.
create or replace view public.juegos_memoria_alumno as
select
  j.id,
  j.titulo,
  j.creado_en,
  (
    select jsonb_agg(
      jsonb_build_object('id', gen_random_uuid(), 'texto', texto)
      order by random()
    )
    from (
      select par ->> 'termino' as texto
      from jsonb_array_elements(j.pares) as par
      union all
      select par ->> 'pareja' as texto
      from jsonb_array_elements(j.pares) as par
    ) todas_las_cartas
  ) as cartas
from public.juegos_memoria j;

grant select on public.juegos_memoria_alumno to authenticated;

-- Verifica si dos textos de cartas hacen pareja, sin exponer el resto de
-- las parejas del juego.
create or replace function public.comprobar_pareja_memoria(
  p_juego_id uuid,
  p_texto_a text,
  p_texto_b text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from jsonb_array_elements(
      (select pares from public.juegos_memoria where id = p_juego_id)
    ) as par
    where (par ->> 'termino' = p_texto_a and par ->> 'pareja' = p_texto_b)
       or (par ->> 'termino' = p_texto_b and par ->> 'pareja' = p_texto_a)
  );
$$;

revoke all on function public.comprobar_pareja_memoria(uuid, text, text)
  from public;
grant execute on function public.comprobar_pareja_memoria(uuid, text, text)
  to authenticated;
