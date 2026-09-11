-- ============================================================================
-- TikTok: pasar de "cada tienda registra su propia app" a la app central
-- de Rentabilify (OAuth de un clic).
--
-- Contexto: hoy tiktok_connections guarda app_id y app_secret POR TIENDA.
-- Con la app propia, esas credenciales son unas solas y viven en variables
-- de entorno del servidor (TIKTOK_APP_ID / TIKTOK_APP_SECRET), nunca en la
-- base de datos. Guardar un client secret por fila es justo lo que revisa
-- TikTok en el security check.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. State de un solo uso para el OAuth (proteccion CSRF)
--    Antes el `state` era el tienda_id, que es adivinable: cualquiera podia
--    disparar el callback contra una tienda ajena.
-- ----------------------------------------------------------------------------
create table if not exists public.tiktok_oauth_states (
  state       text primary key,
  tienda_id   uuid not null references public.tiendas(id) on delete cascade,
  user_id     uuid not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '10 minutes',
  used_at     timestamptz
);

create index if not exists tiktok_oauth_states_expires_idx
  on public.tiktok_oauth_states (expires_at);

-- Sin politicas: solo el service_role (edge functions) toca esta tabla.
alter table public.tiktok_oauth_states enable row level security;

comment on table public.tiktok_oauth_states is
  'States de un solo uso para el OAuth de TikTok. Los consume tiktok-auth-callback.';

-- ----------------------------------------------------------------------------
-- 2. Quitar las credenciales por tienda
--    La vista tiktok_connections_safe expone app_id, asi que hay que
--    recrearla antes de poder dropear la columna.
-- ----------------------------------------------------------------------------
drop view if exists public.tiktok_connections_safe;

alter table public.tiktok_connections drop column if exists app_secret;
alter table public.tiktok_connections drop column if exists app_id;

create view public.tiktok_connections_safe as
select
  id,
  tienda_id,
  user_id,
  connected_at,
  updated_at,
  advertiser_id,
  token_expires_at,
  is_active,
  last_sync_at,
  (access_token is not null and access_token <> '') as is_connected
from public.tiktok_connections;

comment on view public.tiktok_connections_safe is
  'Vista de tiktok_connections sin access_token. Las credenciales de la app viven en env, no aqui.';

-- ----------------------------------------------------------------------------
-- 3. CUTOVER — ejecutar SOLO cuando la app nueva este aprobada y desplegada.
--
--    Los access_token actuales fueron emitidos por las apps propias de cada
--    merchant. Estan atados a ESA app y dejan de servir con la app central:
--    hay que pedirles reconectar (un clic con el flujo nuevo).
--
--    Se deja comentado a proposito: mientras la app nueva no este aprobada,
--    las 3 conexiones vivas siguen sincronizando con normalidad.
-- ----------------------------------------------------------------------------
-- update public.tiktok_connections
--    set access_token = null,
--        is_active    = false,
--        updated_at   = now()
--  where access_token is not null;
