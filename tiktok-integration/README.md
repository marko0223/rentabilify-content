# TikTok for Business — app propia de Rentabilify

Todo lo necesario para pasar de "cada merchant registra su propia app de TikTok"
a un OAuth de un clic con la app central de Rentabilify.

## Por que

Hoy `tiktok_connections` guarda `app_id` y `app_secret` **por tienda**: cada
merchant tiene que crear su propia app de developer en TikTok y pegar las
credenciales. Por eso solo 3 de 145 tiendas tienen TikTok conectado, contra 23
en Meta. Con la app propia el merchant hace clic, autoriza y vuelve.

De paso se corrige un problema de seguridad: un client secret por fila en la
base de datos es justo lo que revisa TikTok en el security check.

## Que hay aca

| Archivo | Que es |
|---|---|
| `supabase/functions/tiktok-auth-start/index.ts` | Genera la URL de autorizacion con un `state` de un solo uso |
| `supabase/functions/tiktok-auth-callback/index.ts` | Recibe el redirect de TikTok e intercambia el `auth_code` por el token |
| `supabase/migrations/20260911000000_tiktok_app_central.sql` | Tabla de states, recrea la vista `safe`, dropea `app_id` y `app_secret` |
| `CAMBIOS-tiktok-ads.md` | Ediciones puntuales en `tiktok-ads/index.ts`, el frontend y `config.toml` |

## Variables de entorno (Supabase → Edge Functions → Secrets)

| Variable | Valor |
|---|---|
| `TIKTOK_APP_ID` | El App ID que da TikTok al crear la app |
| `TIKTOK_APP_SECRET` | El App Secret. **Solo aca** — nunca en la base ni en el front |
| `APP_URL` | `https://rentabilify.app` (hoy cae al default `rentabilify.lovable.app`) |

## Redirect URL a registrar en TikTok

```
https://eqrgbnkxfsskwxdbjmpc.supabase.co/functions/v1/tiktok-auth-callback
```

Path limpio y sin query string a proposito: TikTok agrega `?auth_code=...&state=...`
al redirect, y el matching exacto se rompe si la URL registrada ya trae parametros
(como el actual `tiktok-ads?action=callback`).

## Scopes a pedir

Solo tres, que son los que el codigo realmente llama:

| Scope | Endpoints |
|---|---|
| Ad account management | `/oauth2/advertiser/get/` · `/advertiser/info/` |
| Ads management | `/campaign/get/` |
| Reporting | `/report/integrated/get/` |

## Orden de despliegue

1. Crear la app en TikTok y registrar el redirect URL de arriba.
2. Cargar `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET` y `APP_URL` como secrets.
3. Correr la migracion (sin el bloque de cutover, que va comentado).
4. Desplegar las dos funciones nuevas y aplicar `CAMBIOS-tiktok-ads.md`.
5. Probar el flujo completo en sandbox con una cuenta de prueba.
6. Mandar la app a review.
7. **Recien con la app aprobada**: descomentar el bloque de cutover de la
   migracion y avisar a los 3 merchants conectados que reconecten.

## Por que el paso 7 va al final

Los `access_token` actuales fueron emitidos por las apps propias de cada
merchant. Estan atados a esa app y **dejan de servir** con la app central. Hasta
que hagas el cutover, las 3 conexiones vivas siguen sincronizando normal.
