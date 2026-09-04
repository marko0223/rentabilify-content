# Shopify: el mismo proceso, aplicado al carrito abandonado

Reconocimiento previo, con datos de producción. **No se ha tocado nada.**

---

## 1. El tamaño del agujero

| | 30 días |
|---|---:|
| Conexiones Shopify | 48 |
| Tiendas con bot que son `only_shopify` | **82 de 83** |
| Carritos abandonados | **8.063** |
| Ticket medio | **S/157** |
| Carritos en estado `pendiente` | 6.948 |
| De esos, **con teléfono** | **6.873 (99%)** |
| De esos, tocados por el bot | **234 (3,4%)** |
| Tiendas con `abandoned_cart_enabled` | **2 de 83** |

**Casi 6.900 carritos con teléfono, contactables por WhatsApp, y el bot tocó 234.** A S/157 de ticket medio, es aproximadamente **S/1,08 millones** en carritos pendientes sin trabajar.

Es el mismo patrón que encontramos en WhatsApp —el pedido se crea y nadie lo cobra— pero un orden de magnitud más grande.

## 2. Un bug de datos que hay que mirar primero

| Estado | Carritos | Con `recuperado_pedido_id` |
|---|---:|---:|
| `recuperado` | **1.011** | **10** |

Mil carritos marcados como recuperados y solo diez vinculados a un pedido real. **El estado no se puede creer.** Antes de medir cualquier mejora hay que saber si son recuperaciones reales sin vincular, o si el estado se está poniendo mal. Cualquier métrica de recuperación que saquemos hoy es falsa.

---

## 3. La diferencia de fondo con WhatsApp

En la campaña CTWA el lead llega **sin nada**: hay que descubrir el producto, la cantidad, la ubicación, y crear el pedido. Por eso el hallazgo grande fue «el pedido no se crea».

En Shopify **es al revés: el pedido ya existe**. El carrito abandonado trae producto, cantidad, monto, email, teléfono, y muchas veces dirección, distrito y provincia. El cliente ya eligió y ya llegó al checkout.

Eso cambia el trabajo:

| | WhatsApp CTWA | Shopify |
|---|---|---|
| Punto de partida | Un «hola» | Un carrito con productos y monto |
| Lo que falta | Casi todo | El contacto, y a veces un dato |
| Problema principal | El pedido no se crea | **Nadie contacta** |
| Objeción típica | Precio, confianza, salud | Duda de último momento, envío, pago |
| Ventaja | Conversación abierta | **Ya hay intención de compra demostrada** |

## 4. Lo que se reutiliza tal cual

El prompt v2 sirve **casi entero**. Nada de reescribirlo:

- Las reglas duras: solo datos del contexto, no calcular precios, un dato ya dado está cerrado, una pregunta por mensaje, no prometer lo que no se adjunta.
- Cómo escribe, precios, entrega, cobro, objeciones, cuándo parar.
- Los bloques condicionales por tipo de producto.
- «El pedido es tu memoria» funciona igual: aquí el carrito **es** el pedido.

## 5. Lo que es específico de Shopify

**a) La ventana de 24 horas de WhatsApp.**
Un carrito abandonado no tiene conversación previa, así que el primer contacto **necesita una plantilla HSM aprobada por Meta**. No se puede abrir con texto libre. Esto no existe en CTWA, donde el cliente escribió primero. Los campos ya están: `abandoned_cart_template_name`, `abandoned_cart_template_language`, `abandoned_cart_template_variables`.

**b) El link de recuperación.**
`abandoned_carts.url_recuperacion` permite que el cliente termine la compra en la web con un clic. Es una vía de cierre que no existe en CTWA, y probablemente la más rápida.

**c) Hay que dejar de escribir si compró por otro lado.**
Si el cliente completa el checkout en la web, el bot tiene que callarse. Es el mismo problema que acabamos de encontrar en los rompevistos post-confirmación, y la solución es la misma: comprobar el estado antes de enviar.

**d) La oferta de recuperación.**
`abandoned_cart_offer_enabled` y `abandoned_cart_offers` ya existen. Aquí sí tiene sentido un incentivo, cosa que en CTWA descartamos.

**e) Un carrito puede traer varios productos.**
En CTWA casi siempre es uno. El prompt ya dice que cada producto distinto es un pedido separado; hay que verificar que eso no rompa un carrito de varios artículos.

## 6. Orden propuesto

| # | Paso | Por qué en ese orden |
|---|---|---|
| 1 | Aclarar el bug de los 1.011 «recuperado» con 10 vínculos | Sin esto no se puede medir nada |
| 2 | Comprobar que existe una plantilla HSM aprobada y vigente | Sin ella no hay primer contacto posible |
| 3 | Guarda de estado: no escribir si el carrito ya se convirtió en pedido | Evita repetir el error de los rompevistos |
| 4 | Adaptar el prompt v2 con la apertura de carrito abandonado | Reutiliza todo lo demás |
| 5 | Activar en **una** tienda y medir | Hoy solo 2 de 83 lo tienen encendido |
| 6 | Extender al resto | Con datos, no con fe |

**Antes de nada:** esperar a que el despliegue de WhatsApp esté verificado y con la campaña corriendo. Los dos flujos comparten `promptBuilder` y el runner de seguimientos; tocar Shopify mientras el otro está sin medir mezclaría las causas de cualquier cosa que pase.
