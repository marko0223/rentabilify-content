# Los rompevistos se siguen enviando después de confirmar el pedido

**Verificado en producción, últimos 7 días, KITO STORE.**

## El dato

| | |
|---|---:|
| Rompevistos enviados **después** de la fecha de confirmación del pedido | **280** |
| Pedidos confirmados afectados | **31** |
| Mensajes por cliente que ya compró | **9** |

**Las 9 secuencias de Glucora se disparan íntegras a los 31 pedidos confirmados.** No es que se escape alguna: es la secuencia completa, a cada cliente que ya compró.

## Lo que recibe un cliente después de haber confirmado

| Delay | Mensaje |
|---|---|
| 15 min | «vi que te interesó {{producto}}. ¿Te quedó alguna duda?» |
| 30 min | «{{producto}} te ayuda a apoyar tu bienestar metabólico…» |
| 1 h | «Recuerda que {{producto}} está a {{precio}} con envío incluido…» ← además con el precio vacío |
| 2 h | «¿qué fue lo que te hizo dudar sobre {{producto}}?» |
| 4 h | «Muchas personas ya están notando cambios positivos 💪 ¿Quieres ser **la próxima**?» |
| 6 h | «nos están quedando **pocas unidades** esta semana. ¿Te la separo a {{precio}}?» |
| 9 h | «¿Seguimos con tu pedido **antes de que se acabe el stock**?» |
| 12 h | «¿**sigues interesado**? Te ayudo a **cerrar tu pedido** en 2 minutitos ✅» |
| 16 h | «si tienes alguna duda de último momento, escríbeme» |

A alguien que **ya pagó** se le pregunta qué le hizo dudar, se le mete urgencia de stock y se le ofrece cerrar un pedido que ya está cerrado. Y en el caso del pedido `CRM-6A99A90B` (Hugo, PEN 109, estado *Confirmado · Falta Subir*), el mensaje de las 4 h le pregunta si quiere ser «la próxima».

## Por qué pasa

**No es el prompt.** El prompt viejo incluso tiene la regla, en su línea 23:

> «Si el pedido ya está confirmado, NO vuelvas al flujo de venta ni pidas confirmación de nuevo.»

Pero los rompevistos **no pasan por el prompt**. Los dispara un runner por reloj que no consulta el estado del pedido. La regla del prompt no los alcanza.

## El arreglo, y por qué no toca ninguna secuencia

La corrección es **una condición de parada en el runner**, no una edición de las secuencias:

> Antes de enviar un rompevisto, comprobar el pedido vinculado a la conversación.
> Si `pedidos.confirmado = true`, no enviar y marcar la secuencia como cumplida para esa conversación.

Ninguna secuencia cambia de texto, de orden, de producto ni de estado `activo`. **No se toca `crm_followup_sequences`.** Solo se añade la comprobación que hoy falta.

Conviene extender la misma comprobación a otros estados finales: pedido cancelado, cliente marcado como perdido, o conversación transferida a un humano.

## Impacto

280 mensajes en 7 días a clientes que ya compraron. Es el gasto de mensajería más caro del sistema y el que más daña la percepción de la marca: el cliente que acaba de pagar recibe nueve mensajes tratándolo como si no hubiera comprado.
