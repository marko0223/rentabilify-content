# Análisis del export de 161 chats — primer corte con el despliegue en producción

**Export:** KITO STORE · 03/09/2026 **15:32** (hora Perú) · últimos 7 días · **161 chats · 1,793 mensajes**
**Despliegue del bot:** 03/09 14:15 hora Perú. El export cubre **1 h 17 min de operación posterior** (196 mensajes del bot).

Es la misma ventana rodante que los dos exports anteriores, tomada más tarde el mismo día. Comparable directo.

---

## 1. Evolución de los tres exports

| | 105 chats (13:00) | 123 chats (13:46) | **161 chats (15:32)** |
|---|---:|---:|---:|
| Mensajes | 1,080 | 1,314 | **1,793** |
| Pedidos creados | 8 | 10 | **15** |
| Pedidos confirmados | 1 | 1 | **3** |
| Ratio mensajes bot/cliente | 1.9x | 1.99x | **1.92x** |
| Chats que mueren con el bot hablando solo | 72% | 71% | **73%** |

Los pedidos confirmados pasan de 1 a 3 (chats 56, 64 y 90). **No se puede atribuir al despliegue**: son 3 casos en una ventana de 77 minutos. Es una señal para vigilar, no un resultado.

---

## 2. Antes y después del despliegue (mensajes del bot)

| Señal | Antes (915 msgs) | Después (196 msgs) | |
|---|---:|---:|---|
| Descargo médico | 1,0% | **13,3%** | ✅ funciona |
| Venta cruzada de la crema | 1,2% | **0,0%** | ✅ eliminada |
| CTA «¿A qué ciudad y distrito?» | 7,0% | 4,1% | ⚠️ sigue |
| Se despide y pregunta a la vez | 1,4% | 1,0% | ⚠️ sigue |
| Dice «envío gratis / incluido» | 14,6% | 17,3% | ❌ sin arreglar |
| Precio vacío (rompevisto) | 11,0% | 9,7% | ❌ no se tocó |
| **Pide nombre completo o DNI** | 0,4% | **0,0%** | 🔴 **empeoró** |
| **Línea con un emoji suelto** | 0,0% | **3,1%** | 🆕 **regresión** |

### Lo que funcionó
El guardarraíl de salud es real y observable. Además de multiplicar el descargo por trece, **eliminó por completo la venta cruzada de la crema para neuropatía**: 11 mensajes antes, 0 después. Era el riesgo más serio del análisis anterior.

### La regresión, y qué la causa
El filtro que elimina las peticiones de datos ya capturadas **borra la pregunta y deja huérfano el emoji que la acompañaba**. Ejemplo del chat 64:

> Anotado las 2 unidades por S/ 109! 🙌 Pagas contraentrega al recibir en casa 📦.
>
> 📍
>
> ¿Me pasas tu dirección exacta para coordinar la entrega? 🏠

Aquí el filtro **hizo bien su trabajo**: quitó la pregunta de ciudad redundante y dejó la de dirección. Y ese chat terminó **confirmado**. El defecto es cosmético, pero delata que se está limpiando el texto ya escrito en vez de evitar que se genere.

### La señal preocupante
`pide nombre completo o DNI` cae de 0,4% a **0,0%**. Ya era bajísimo, pero llegar a cero justo cuando entra un filtro cuyo trabajo es quitar peticiones de datos merece revisión: puede estar filtrando de más.

---

## 3. Los 15 pedidos

| | |
|---|---:|
| Confirmados | **3** (chats 56, 64, 90) |
| En `falta_pago` | **9** |
| Recibieron petición de adelanto | **5 de 15** |
| Recibieron petición de nombre o DNI | **3 de 15** |

Sigue el mismo patrón: se crea el pedido y no se cobra. **Diez de los quince pedidos nunca vieron una solicitud de adelanto.**

---

## 4. Lo que sigue igual

**El bot habla solo.** 117 de 161 chats (73%) terminan con tres o más mensajes del bot sin respuesta. Racha máxima: 7 seguidos. Idéntico a antes.

**Sigue prometiendo un video que no puede enviar**, y con una excusa nueva. A la misma clienta del análisis anterior, ya después del despliegue:
> «Mil disculpas, Liliana! 🙏 **El sistema debe estar lento**, te envío el video nuevamente en este mensaje. 📹» — 14:37

**Cinco chats donde el cliente declara diabetes, insulina o embarazo y el bot no responde nada.** El descargo mejoró, pero el silencio ante una condición declarada no se corrigió.

---

## 5. Qué pedir en la siguiente ronda

1. **Quitar la basura del filtro**: si se elimina una pregunta, eliminar también los emojis y saltos que quedaban a su alrededor.
2. **Verificar que el filtro no esté borrando de más**: `pide_datos` en 0,0% de 196 mensajes.
3. **Mover la lógica de slots antes de generar**, no después: el CTA no debería escribirse cuando el slot está lleno, en vez de borrarse a posteriori.
4. **Nunca dejar sin respuesta** un mensaje donde el cliente declara una condición de salud (5 casos).
5. **Bloquear la promesa de media** que el bot no puede enviar, y prohibir inventar excusas técnicas.
6. **Coherencia de envío**: «envío gratis» subió a 17,3% mientras agencia cobra S/20.
