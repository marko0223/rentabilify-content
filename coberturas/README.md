# Cobertura: por qué "Llacuabamba" salía sin cobertura

Diagnóstico y corrección del falso "no hay cobertura" en el bot de
confirmación de Rentabilify (proyecto Lovable `rentabilify`,
`f07cabe8-35ce-4164-b1b0-1daca62e1ba1`).

## 1. Causa raíz

El catálogo de cobertura está al nivel de **distrito**:
`cobertura_aliclik_template` tiene 1.861 filas y 25 departamentos — es la
lista de distritos del Perú. Cada tienda copia esa lista a
`cobertura_zonas` (~1.860 filas por tienda).

**Llacuabamba no es un distrito**: es un centro poblado del distrito de
**Parcoy**, provincia de Pataz, La Libertad. Lo mismo Retamas (Parcoy) y
Chagual (Pataz). Por eso no está, y por eso nunca va a estar mientras el
catálogo se llene con distritos.

`supabase/functions/_shared/coverage.ts` hace un match estricto —distrito
exacto, provincia exacta, comodín de departamento, substring inequívoco— y
si nada matchea devuelve `sin_cobertura`. Correcto como diseño, pero le
falta el paso previo: traducir el nombre del centro poblado a su distrito.

## 2. El problema es más grande que Llacuabamba

Distritos escritos en `pedidos` (últimos 180 días) que **no existen** en el
catálogo, por volumen — solo Perú:

| escrito por el cliente | pedidos | distrito real |
|---|---:|---|
| pucallpa | 424 | Callería |
| coronel portillo | 247 | Callería |
| la convención | 239 | Santa Ana |
| cercado de lima | 218 | Lima |
| nazca | 145 | Nasca (ortografía) |
| huamanga | 129 | Ayacucho |
| puerto maldonado | 127 | Tambopata |
| san román | 123 | Juliaca |
| cañete | 83 | San Vicente de Cañete |
| canchis | 81 | Sicuani |
| mariscal nieto | 66 | Moquegua |
| sánchez carrión | 54 | Huamachuco |
| 26 de octubre | 53 | distrito real ausente del catálogo |
| pasco / cerro de pasco | 75 | Chaupimarca |
| atalaya | 51 | Raymondi |
| maynas | 50 | Iquitos |
| sjl / sjm / smp | 88 | abreviaturas |
| chosica / lurigancho chosica | 34 | Lurigancho |
| tingo maría | 17 | Rupa-Rupa |
| quillabamba | 19 | Santa Ana |

Son ~2.000 pedidos en 180 días con una ubicación que el resolvedor no puede
matchear. No todos terminaron en "sin cobertura" (algunos matchean por
provincia o por substring), pero todos pasan por el camino frágil.

## 3. Segundo defecto, independiente: el mapeo de Shopify

El pedido que disparó el reporte (`FG#11071`, tienda Figurisse, 02/09) llegó
de Shopify así:

```
shipping_address.city      = "Llacuabamba"
shipping_address.province  = "La Libertad"   (PE-LAL)
```

y se guardó así:

```
distrito     = "La Libertad"   ← es el departamento, no el distrito
provincia    = "Huaraz"        ← inventado
departamento = "Áncash"        ← región equivocada
cobertura    = "SIN COBERTURA"
```

Con el departamento mal, **ningún** catálogo lo habría salvado. El
`mapping_mode: "auto"` metió el `province` de Shopify en `distrito` y
rellenó departamento/provincia con valores que no vienen del payload. Esto
hay que corregirlo aparte del catálogo, en el webhook de Shopify.

## 4. La corrección propuesta

Una capa de **equivalencias**, no más filas de cobertura duplicadas:

- `001_cobertura_localidades.sql` — tabla `cobertura_localidades`
  (alias → distrito canónico, con departamento obligatorio cuando el nombre
  se repite entre regiones), más `cob_norm()` para comparar sin tildes.
  Migración aditiva; no toca ninguna fila existente. Cada tienda puede
  añadir sus propios alias (`tienda_id`), que pisan al catálogo global.
- `002_seed_localidades_pe.sql` — 57 equivalencias verificadas: los centros
  poblados de Pataz del caso reportado, los centros poblados de más tráfico
  COD, las provincias escritas en vez del distrito capital, las ortografías
  alternas y las abreviaturas de Lima.
- `003_coverage_ts.patch.md` — el reintento en `coverage.ts`. **El alias
  nunca gana sobre un match real**: primero se busca con el nombre tal cual,
  y solo si eso no encuentra nada se traduce y se repite la misma búsqueda
  estricta, con los mismos filtros de logística y modalidad.

Lo que la capa **no** hace: inventar cobertura. Si la tienda no cubre
Parcoy, "Llacuabamba" sigue devolviendo `sin_cobertura` — correctamente.

## 5. Cómo aplicarlo

1. Ejecutar `001` y luego `002` contra la base del proyecto.
2. Aplicar el parche de `003` a `supabase/functions/_shared/coverage.ts`
   (y su gemelo en el front si corresponde), con los tests del punto 6 del
   propio parche.
3. Verificación: la consulta de la sección 2 debería quedar sin filas
   peruanas relevantes salvo las etiquetas de formulario
   ("otros distritos (envío gratis por Shalom)", "-", etc.).

## 6. Pendiente aparte

- Corregir el mapeo `auto` de Shopify (sección 3) — es la causa real del
  pedido FG#11071.
- Aliclik/otros catálogos: al reimportar plantilla no se pierden los alias,
  porque viven en otra tabla.
