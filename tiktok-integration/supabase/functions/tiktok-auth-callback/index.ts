// Callback OAuth de TikTok para la app central de Rentabilify.
//
// Reemplaza a `tiktok-ads?action=callback`. Path limpio, sin query string:
// TikTok agrega ?auth_code=...&state=... al redirect_uri y el matching
// exacto se rompe si la URL registrada ya trae parametros.
//
// Esta es la URL que va en "Advertiser redirect URL" al crear la app:
//   https://<project-ref>.supabase.co/functions/v1/tiktok-auth-callback
//
// config.toml:  [functions.tiktok-auth-callback]  verify_jwt = false
// (TikTok llama sin JWT; la identidad viene del `state` de un solo uso)

import { createClient } from "npm:@supabase/supabase-js@2";

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3";

function appUrl(): string {
  return Deno.env.get("APP_URL") || "https://rentabilify.app";
}

function backTo(status: string, reason?: string): Response {
  const qs = reason
    ? `oauth=${status}&reason=${encodeURIComponent(reason.slice(0, 200))}`
    : `oauth=${status}`;
  return new Response(null, {
    status: 302,
    headers: { Location: `${appUrl()}/integraciones/tiktok?${qs}` },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  try {
    // TikTok manda auth_code; algunos flujos usan `code`.
    const authCode = url.searchParams.get("auth_code") || url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error") || url.searchParams.get("error_description");

    if (error) return backTo("error", error);
    if (!authCode || !state) return backTo("error", "Faltan parametros de OAuth");

    const appId = Deno.env.get("TIKTOK_APP_ID");
    const appSecret = Deno.env.get("TIKTOK_APP_SECRET");
    if (!appId || !appSecret) {
      console.error("TIKTOK_APP_ID / TIKTOK_APP_SECRET no configurados");
      return backTo("error", "Integracion no configurada");
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- Validar el state: existe, no usado, no vencido ----
    const { data: st } = await adminClient
      .from("tiktok_oauth_states")
      .select("state, tienda_id, user_id, expires_at, used_at")
      .eq("state", state)
      .maybeSingle();

    if (!st) return backTo("error", "Solicitud de autorizacion no reconocida");
    if (st.used_at) return backTo("error", "Esta autorizacion ya fue usada");
    if (new Date(st.expires_at).getTime() < Date.now()) {
      return backTo("error", "La autorizacion expiro, intenta de nuevo");
    }

    // Se marca usado antes del intercambio: un replay no sirve aunque falle abajo.
    await adminClient
      .from("tiktok_oauth_states")
      .update({ used_at: new Date().toISOString() })
      .eq("state", state);

    // ---- Intercambiar auth_code por access_token (secret desde env) ----
    const tokenRes = await fetch(`${TIKTOK_API}/oauth2/access_token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, secret: appSecret, auth_code: authCode }),
    });

    const tokenData = await tokenRes.json().catch(() => null);

    if (!tokenData || tokenData.code !== 0 || !tokenData.data?.access_token) {
      console.error("TikTok token exchange failed:", tokenData?.code, tokenData?.message);
      return backTo("error", tokenData?.message || "No se pudo obtener el token");
    }

    const { access_token, advertiser_ids, scope } = tokenData.data;
    const firstAdvertiserId = Array.isArray(advertiser_ids) && advertiser_ids.length > 0
      ? String(advertiser_ids[0])
      : null;

    console.log(
      `TikTok OAuth ok para tienda ${st.tienda_id}: ${advertiser_ids?.length || 0} cuentas, scope=${JSON.stringify(scope)}`
    );

    // upsert: la tienda puede no tener fila todavia (ya no se crea al guardar credenciales)
    const { error: upsertErr } = await adminClient
      .from("tiktok_connections")
      .upsert(
        {
          tienda_id: st.tienda_id,
          user_id: st.user_id,
          access_token,
          advertiser_id: firstAdvertiserId,
          is_active: true,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tienda_id" }
      );

    if (upsertErr) {
      console.error("No se pudo guardar la conexion:", upsertErr);
      return backTo("error", "No se pudo guardar la conexion");
    }

    return backTo("success");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("tiktok-auth-callback error:", message);
    return backTo("error", message);
  }
});
