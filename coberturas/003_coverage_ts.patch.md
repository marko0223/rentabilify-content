# Parche para `supabase/functions/_shared/coverage.ts`

Regla que se respeta: **el alias nunca gana sobre un match real**. Primero se
busca con el nombre tal cual llegó; solo si eso no resuelve se traduce por el
catálogo y se repite la MISMA búsqueda estricta. Así una tienda que tenga
literalmente "Pucallpa" configurada sigue matcheando por "Pucallpa".

## 1. Cargador del catálogo (cache de 5 min, igual que las zonas)

```ts
type LocalidadAlias = {
  alias: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string;
};

const _aliasCache = new Map<string, { at: number; rows: LocalidadAlias[] }>();
const ALIAS_TTL_MS = 5 * 60 * 1000;

export function invalidateAliasCache(key?: string) {
  if (key) _aliasCache.delete(key);
  else _aliasCache.clear();
}

async function loadAliases(
  supabase: any,
  pais: string,
  tiendaId: string,
): Promise<LocalidadAlias[]> {
  const key = `${pais}:${tiendaId}`;
  const cached = _aliasCache.get(key);
  if (cached && Date.now() - cached.at < ALIAS_TTL_MS) return cached.rows;

  const { data } = await supabase
    .from("cobertura_localidades")
    .select("alias, departamento, provincia, distrito, tienda_id")
    .eq("pais", pais)
    .eq("activo", true)
    .or(`tienda_id.is.null,tienda_id.eq.${tiendaId}`);

  // Los alias propios de la tienda pisan al catálogo global.
  const rows = [...((data || []) as any[])].sort(
    (a, b) => (a.tienda_id ? -1 : 1) - (b.tienda_id ? -1 : 1),
  ) as LocalidadAlias[];

  _aliasCache.set(key, { at: Date.now(), rows });
  return rows;
}

/**
 * Traduce el nombre escrito por el cliente al distrito canónico.
 * Devuelve null si no hay entrada, o si la hay pero es de otro departamento
 * (jamás se cruza de región).
 */
function traducirAlias(
  aliases: LocalidadAlias[],
  nombre: string,
  departamento: string,
): string | null {
  const n = norm(nombre);
  if (!n) return null;
  const candidatos = aliases.filter((a) => norm(a.alias) === n);
  if (!candidatos.length) return null;

  // 1. Alias declarado para ese departamento.
  const conDept = candidatos.filter(
    (a) => norm(a.departamento || "") === departamento,
  );
  if (conDept.length === 1) return conDept[0].distrito;
  if (conDept.length > 1) return null; // configuración ambigua → no adivinar

  // 2. Alias sin departamento (inequívoco a nivel país) y único.
  const global = candidatos.filter((a) => !norm(a.departamento || ""));
  if (global.length === 1) return global[0].distrito;
  return null;
}
```

## 2. `resolveCoverageDetailed` — reintento por alias

`criterio` gana un valor nuevo:

```ts
criterio: "distrito" | "provincia" | "departamento" | "substring"
        | "localidad" | "fallback_pais" | "ninguno";
```

Y el bloque que hoy dice:

```ts
  const { rows, criterio, falta } = buscar();
  if (!rows.length) {
```

pasa a:

```ts
  let { rows, criterio, falta } = buscar();

  // 🔁 Reintento por catálogo de localidades. Solo cuando la búsqueda
  //    estricta no encontró NADA (no cuando quedó `pendiente` por un dato
  //    faltante ni cuando fue `ambigua`): el alias normaliza el nombre, no
  //    suple información ausente.
  let viaAlias: string | null = null;
  if (!rows.length && !falta && criterio !== "substring") {
    const pais = norm(tiendaPais || "PE").startsWith("pe") ? "PE" : String(tiendaPais || "PE").toUpperCase();
    const aliases = await loadAliases(supabase, pais, tiendaId);
    const canonico =
      traducirAlias(aliases, loc.distrito || "", tDept) ||
      traducirAlias(aliases, loc.provincia || "", tDept);

    if (canonico && norm(canonico) !== tDist) {
      viaAlias = canonico;
      const canon = norm(canonico);
      const m = clasificarPublic(zonas.filter((z) => norm(z.ciudad || "") === canon), "localidad");
      if (m?.rows.length) {
        rows = m.rows;
        criterio = "localidad";
        falta = undefined;
      }
    }
  }

  if (!rows.length) {
```

`clasificarPublic` es la misma función `clasificar` que ya vive dentro de
`buscar()`, extraída al scope de `resolveCoverageDetailed` para poder
reutilizarla (mismo cuerpo, sin cambios de lógica).

El resto del flujo (requisito de logística, requisito de modalidad, detección
de conflicto) queda **idéntico**: un match por alias pasa por los mismos
filtros que uno directo.

## 3. Huella y evento

En el `return` final, cuando `criterio === "localidad"` conviene dejar rastro
del alias aplicado para poder auditarlo:

```ts
    huella: fingerprint(row) + (viaAlias ? `|alias:${norm(viaAlias)}` : ""),
    evento: criterio === "localidad" ? "cobertura_falso_negativo_prevenido" : ...
```

## 4. `lookupCoverageRow` (legado)

Mismo reintento, después del paso 4 (substring) y antes del `return { row: null }`.

## 5. Firma

`resolveCoverageDetailed` necesita el país de la tienda para elegir el
catálogo. Si no está ya disponible en el contexto, se lee junto con las zonas
(`tiendas.pais`) y se cachea igual que ellas.

## 6. Tests a añadir en `src/test/`

- `Llacuabamba` + `La Libertad` → resuelve como `Parcoy`, criterio `localidad`.
- `Llacuabamba` + `Áncash` → **no** resuelve (no se cruza de región).
- `Pucallpa` en una tienda que tiene la fila literal "Pucallpa" → matchea
  directo, criterio `distrito`, sin pasar por el alias.
- `Pucallpa` + `Ucayali` en una tienda sin esa fila → resuelve como `Callería`.
- Alias que apunta a un distrito que la tienda NO cubre → `sin_cobertura`
  (el alias traduce, no inventa cobertura).
- Alias + modalidad incompatible → `ambigua`, nunca la modalidad contraria.
