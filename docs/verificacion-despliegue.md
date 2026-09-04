# Verificación del despliegue · 04/09/2026 00:30

## ✅ Lo que quedó bien

| Comprobación | Resultado |
|---|---|
| Prompt nuevo en el código | ✅ `buildSystemPrompt` en `_shared/promptBuilder.ts` |
| Se arma en cada ejecución | ✅ `ai_system_prompt` vacío en las 83 tiendas — se acabó la foto congelada |
| Variables sin resolver | ✅ ninguna: usa interpolación real (`${asesor}`, `${tienda}`, `${courier}`…) |
| Nombre de tienda en el prompt | ✅ no |
| Cuenta Yape en el prompt | ✅ no |
| Courier escrito a mano | ✅ no, sale de `ctx.courier` |
| L159 «cada mensaje termina con pregunta» | ✅ eliminada — ahora dice lo contrario: *«Puedes terminar un mensaje sin pregunta… No fuerces una pregunta al final»* |
| L37 «mínimo 2 intentos de retención» | ✅ eliminada — ahora *«UN intento… si lo repite, paras»* |
| L26/L63 «jamás digas un tiempo concreto» | ✅ eliminadas — ahora *«Das el plazo, el día y la franja que traiga el CONTEXTO»* |
| L112 «el precio es fijo» | ✅ eliminada del prompt |
| L85 «flete por adelantado» | ✅ eliminada del prompt |
| Bloques condicionales | ✅ implementados con banderas de contexto (`es_producto_de_salud`, `producto_tiene_variantes`, `producto_es_tecnico`, `producto_tiene_garantia`, `modulo_logistico_activo`) |
| `adelanto_agencia.mensaje` de KITO | ✅ reescrito: *«…el envío no tiene costo: este adelanto se descuenta del total y el saldo lo pagas al recoger»* |
| `prompt_config.required_fields` raíz | ✅ eliminado (`null`) |
| **Rompevistos** | ✅ **18 secuencias, 18 activas, sin cambios de contenido** |

## ⚠️ Residuos en `DEFAULT_PROMPT_CONFIG`

Son los valores por defecto que hereda **una tienda nueva**. La fila de Kito Store está corregida, pero estos siguen ahí:

| # | Residuo | Riesgo |
|---|---|---|
| 1 | `adelanto_agencia.mensaje` por defecto sigue diciendo **«el pago del flete por adelantado»** | Una tienda nueva nace con la contradicción que acabamos de quitar |
| 2 | `ofertas_promociones` por defecto trae promos inventadas: **«2 unidades por S/80, 3 por S/110, envío gratis sobre S/100»** | Si se inyectan como promos reales, el bot ofrece descuentos que no existen |
| 3 | `manejo_objeciones` por defecto dice **«El adelanto cubre el flete del envío»** | Mismo problema del flete, por otra vía |
| 4 | `mensaje_no_descuento` y `no_dar_fechas_exactas: true` siguen en los defaults | Hoy el prompt nuevo no los usa, pero quedan como trampas si alguien vuelve a engancharlos |

## ❓ Lo que no pude verificar desde aquí

| Qué | Cómo se comprueba |
|---|---|
| Que el autoresponder **inyecte** las cuentas y el adelanto en el CONTEXTO | `describeCuentas` y `describeAdelanto` ya no se llaman desde `buildSystemPrompt`. Si el motor no los inyecta, el bot no tendrá las cuentas. **Comprobar en el primer chat que llegue a pedir adelanto** |
| Que el pedido se cree al resolver la ubicación | Ver si aparecen pedidos nuevos en chats donde el cliente da distrito |
| Que los rompevistos se detengan tras confirmar | Ver si bajan los envíos posteriores a `fecha_confirmacion` |
| Que `confirmation_required_fields` ya no se use | La columna sigue con `{nombre, coordenadas, telefono}` |

## Qué mirar en la primera hora de campaña

1. Que ningún mensaje salga con un `{algo}` literal.
2. Que aparezcan **pedidos creados** en cuanto el cliente da su distrito.
3. Que el bot **pida el DNI o la dirección**, que es lo que nunca hacía.
4. Que **no** pregunte la ciudad después de haberla usado.
5. Que al pedir adelanto **incluya las cuentas** en el mismo mensaje.
