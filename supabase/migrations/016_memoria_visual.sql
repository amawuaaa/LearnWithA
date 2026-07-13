-- Añade imágenes representadas por emojis a las tarjetas y registra el tiempo.

alter table public.memoria_resultados
  add column if not exists duracion_segundos integer
  check (duracion_segundos > 0);

create or replace view public.juegos_memoria_alumno
with (security_invoker = false)
as
select
  juego.id,
  juego.titulo,
  juego.creado_en,
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', gen_random_uuid(),
        'texto', carta.texto,
        'emoji', carta.emoji,
        'tipo', carta.tipo
      )
      order by random()
    )
    from (
      select
        par ->> 'termino' as texto,
        null::text as emoji,
        'termino'::text as tipo
      from jsonb_array_elements(juego.pares) as par
      union all
      select
        par ->> 'pareja' as texto,
        nullif(par ->> 'emoji', '') as emoji,
        'pareja'::text as tipo
      from jsonb_array_elements(juego.pares) as par
    ) as carta
  ) as cartas
from public.juegos_memoria as juego;

grant select on public.juegos_memoria_alumno to authenticated;
