# Cambios en `supabase/functions/tiktok-ads/index.ts`

Dos ediciones. El resto de la funcion (sync, cron, reportes) no se toca.

---

## 1. Borrar el bloque `action === "callback"`

Lo reemplaza la funcion `tiktok-auth-callback`. Borra el bloque completo, desde:

```ts
    // ====== OAuth callback ======
    if (action === "callback") {
```

hasta el cierre de ese `if` (justo antes de `// ====== List ALL available advertiser accounts from TikTok ======`).

Con el bloque se va tambien el ultimo uso de `app_id` / `app_secret` desde la base
de datos en el flujo de autorizacion.

---

## 2. `action === "list-accounts"`: secret desde env, no desde la fila

### Antes

```ts
      const { data: conn } = await adminClient
        .from("tiktok_connections")
        .select("access_token, advertiser_id, app_id, app_secret")
        .eq("tienda_id", tiendaId)
        .single();
```

### Despues

```ts
      const { data: conn } = await adminClient
        .from("tiktok_connections")
        .select("access_token, advertiser_id")
        .eq("tienda_id", tiendaId)
        .single();
```

Y mas abajo, en la llamada a `/oauth2/advertiser/get/`:

### Antes

```ts
        const authRes = await fetch(
          `${TIKTOK_API}/oauth2/advertiser/get/?app_id=${conn.app_id}&secret=${encodeURIComponent(conn.app_secret || "")}`,
          { headers: { "Access-Token": conn.access_token } }
        );
```

### Despues

```ts
        const appId = Deno.env.get("TIKTOK_APP_ID")!;
        const appSecret = Deno.env.get("TIKTOK_APP_SECRET")!;
        const authRes = await fetch(
          `${TIKTOK_API}/oauth2/advertiser/get/?app_id=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`,
          { headers: { "Access-Token": conn.access_token } }
        );
```

---

## 3. Frontend: `src/pages/integraciones/...` (la pantalla de TikTok)

Quita el formulario donde el merchant pega App ID y App Secret. El boton
"Conectar TikTok" pasa a pedirle la URL al backend:

```ts
const { data, error } = await supabase.functions.invoke("tiktok-auth-start", {
  body: { tienda_id: tiendaId },
});

if (error || !data?.ok) {
  toast.error(data?.error ?? "No se pudo iniciar la conexion con TikTok");
  return;
}

window.location.href = data.auth_url;
```

El merchant ya no registra nada en TikTok: hace clic, autoriza y vuelve.

---

## 4. `supabase/config.toml`

```toml
  [functions.tiktok-auth-start]
    verify_jwt = true
  [functions.tiktok-auth-callback]
    verify_jwt = false
```

`tiktok-auth-start` necesita el JWT para verificar que la tienda es del usuario.
`tiktok-auth-callback` lo llama TikTok, que no manda JWT: ahi la identidad la da
el `state` de un solo uso.
