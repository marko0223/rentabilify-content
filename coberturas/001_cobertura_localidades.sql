-- ============================================================================
-- 001 — Catálogo de localidades / alias de cobertura
-- ============================================================================
-- Problema que resuelve:
--   `cobertura_zonas.ciudad` y `cobertura_aliclik_template.ciudad` están al
--   nivel de DISTRITO (1.861 filas ≈ los distritos del Perú). Los clientes
--   escriben centros poblados ("Llacuabamba", "Retamas"), provincias
--   ("Coronel Portillo"), abreviaturas ("SJL") u ortografías alternas
--   ("Nazca"). Nada de eso matchea y `resolveCoverageDetailed` devuelve
--   `sin_cobertura`.
--
-- Este catálogo NO reemplaza a cobertura_zonas: solo TRADUCE el nombre que
-- escribió el cliente al nombre canónico del distrito, y recién entonces se
-- vuelve a buscar en la cobertura de la tienda. Es una normalización
-- determinista (tabla de equivalencias), no una adivinanza.
--
-- Migración ADITIVA: no toca ni borra ninguna fila existente.
-- Reversible con:  drop table public.cobertura_localidades;
--                  drop function public.cob_norm(text);
-- ============================================================================

-- Normalizador inmutable (unaccent() es STABLE y no sirve para índices).
create or replace function public.cob_norm(t text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    lower(translate(
      coalesce(t, ''),
      'áàäâãÁÀÄÂÃéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ',
      'aaaaaAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC'
    )),
    '[^a-z0-9]+', ' ', 'g'
  ))
$$;

comment on function public.cob_norm(text) is
  'Normaliza un nombre geográfico para comparación: minúsculas, sin tildes, '
  'sin puntuación, espacios colapsados. Inmutable (usable en índices).';

create table if not exists public.cobertura_localidades (
  id            uuid primary key default gen_random_uuid(),
  pais          text not null default 'PE',
  -- Nombre tal como lo escribe el cliente / lo manda Shopify.
  alias         text not null,
  -- Departamento en el que el alias es válido. NULL solo para alias
  -- inequívocos en todo el país. Obligatorio si el nombre se repite
  -- (ej. "Santa Ana" existe en Cusco y en Huancavelica).
  departamento  text,
  provincia     text,
  -- Nombre canónico del distrito, tal como aparece en cobertura_zonas.ciudad.
  distrito      text not null,
  -- centro_poblado | provincia | abreviatura | ortografia | distrito_nuevo
  tipo          text not null default 'centro_poblado',
  fuente        text,
  activo        boolean not null default true,
  -- NULL = catálogo global. Con tienda_id = alias propio de esa tienda,
  -- que tiene prioridad sobre el global.
  tienda_id     uuid references public.tiendas(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.cobertura_localidades is
  'Equivalencias nombre-escrito-por-el-cliente → distrito canónico. La usa '
  'supabase/functions/_shared/coverage.ts cuando el match estricto falla.';

create unique index if not exists cobertura_localidades_uniq
  on public.cobertura_localidades (
    pais,
    public.cob_norm(alias),
    coalesce(public.cob_norm(departamento), ''),
    coalesce(tienda_id::text, '')
  );

create index if not exists cobertura_localidades_lookup
  on public.cobertura_localidades (pais, public.cob_norm(alias))
  where activo;

alter table public.cobertura_localidades enable row level security;

-- Catálogo global: lectura para cualquier usuario autenticado.
drop policy if exists cobertura_localidades_select on public.cobertura_localidades;
create policy cobertura_localidades_select
  on public.cobertura_localidades for select
  to authenticated
  using (tienda_id is null or tienda_id in (
    select id from public.tiendas where user_id = auth.uid()
  ));

-- Alias propios: cada dueño gestiona los de sus tiendas. El catálogo global
-- (tienda_id is null) solo se edita con service_role.
drop policy if exists cobertura_localidades_write on public.cobertura_localidades;
create policy cobertura_localidades_write
  on public.cobertura_localidades for all
  to authenticated
  using (tienda_id in (select id from public.tiendas where user_id = auth.uid()))
  with check (tienda_id in (select id from public.tiendas where user_id = auth.uid()));
