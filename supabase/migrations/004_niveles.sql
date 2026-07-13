-- Ejecuta este archivo si ya aplicaste las migraciones anteriores.
-- Añade niveles CEFR (A1-C1) a estudiantes, tests y vocabulario/verbos.
-- El contenido sin nivel (juegos, vocabulario creado antes de esta
-- migración) queda visible para todos: solo se bloquea lo que tiene
-- un nivel asignado por encima del nivel del estudiante.

alter table public.usuarios
  add column if not exists nivel text not null default 'A1'
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1'));

alter table public.tests
  add column if not exists nivel text not null default 'A1'
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1'));

alter table public.contenido_didactico
  add column if not exists nivel text
    check (nivel in ('A1', 'A2', 'B1', 'B2', 'C1'));
