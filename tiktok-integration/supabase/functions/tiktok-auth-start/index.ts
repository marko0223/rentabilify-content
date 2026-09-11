// Inicia el OAuth de TikTok con la app central de Rentabilify.
//
// El merchant ya NO registra su propia app en TikTok: usamos TIKTOK_APP_ID.
// Devuelve la URL de autorizacion con un `state` aleatorio de un solo uso,
// guardado en tiktok_oauth_states para poder validarlo en el callback.
//
// config.toml:  [functions.tiktok-auth-start]  verify_jwt = true
// Necesita el JWT del usuario para comprobar que la tienda es suya.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TIKTOK_AUTH_URL = "https://business-api.tiktok.com/portal/auth";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("TIKTOK_APP_ID");
    if (!appId) {
      return jsonResponse({ ok: false, error: "TIKTOK_APP_ID no configurado" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonResponse({ ok: false, error: "No autenticado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Cliente con el JWT del usuario: resuelve quien es sin confiar en el body.
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: auth, error: authErr } = await userClient.auth.getUser();
    if (authErr || !auth?.user) {
      return jsonResponse({ ok: false, error: "Sesion invalida" }, 401);
    }
    const userId = auth.user.id;

    const body = await req.json().catch(() => ({}));
    const tiendaId = String(body?.tienda_id || "");
    if (!tiendaId) return jsonResponse({ ok: false, error: "Falta tienda_id" }, 400);

    const adminClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // La tienda tiene que ser del usuario que pide la autorizacion.
    const { data: tienda } = await adminClient
      .from("tiendas")
      .select("id")
      .eq("id", tiendaId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!tienda) {
      return jsonResponse({ ok: false, error: "Tienda no encontrada" }, 403);
    }

    // state aleatorio de un solo uso: evita que un tercero dispare el callback.
    const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const { error: stateErr } = await adminClient.from("tiktok_oauth_states").insert({
      state,
      tienda_id: tiendaId,
      user_id: userId,
    });
    if (stateErr) {
      console.error("No se pudo guardar el state:", stateErr);
      return jsonResponse({ ok: false, error: "No se pudo iniciar la autorizacion" }, 500);
    }

    const redirectUri = `${supabaseUrl}/functions/v1/tiktok-auth-callback`;
    const authUrl =
      `${TIKTOK_AUTH_URL}?app_id=${encodeURIComponent(appId)}` +
      `&state=${encodeURIComponent(state)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return jsonResponse({ ok: true, auth_url: authUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("tiktok-auth-start error:", message);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
