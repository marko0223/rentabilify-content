# Análisis del export de 123 chats contra la config del bot y los últimos commits

**Export:** KITO STORE · 03/09/2026 13:46 · últimos 7 días · **123 chats · 1,314 mensajes**
**Contraste:** configuración viva de `crm_bot_settings` y `crm_followup_sequences`, y los 25 commits del proyecto Lovable del 03/09 (04:57 → 18:40).

> Es la **misma ventana de 7 días** que el export anterior de 105 chats, tomada 3 horas después. Se puede comparar directo.

---

## 0. Corrección al análisis anterior

En el documento previo afirmé que las 7 secuencias de Verrucure tenían `producto_id` vacío y se disparaban a leads de Glucora. **Es falso.** Lo inferí de `cobertura = 'todos'` sin haber consultado la columna. Al verificarla:

- Las 18 secuencias activas **sí** tienen `producto_id` asignado: 7 a `VERRUCURE + CICATRIVERRU`, 2 a `Set x2 Pelador Multifuncional`, **9 a Glucora**.
- El export de 123 chats confirma **0 menciones de Verrucure** en chats de Glucora.

Lo que sí es cierto, y es el problema real: **un lead de Glucora tiene 9 rompevistos configurados** a los 15 min, 30 min, 1 h, 2 h, 4 h, 6 h, 9 h, 12 h y 16 h. La acción de la Fase 1 no es apagar Verrucure — es **reducir esas 9 a 3 o 4 y segmentarlas por estado**.

---

## 1. Qué cambió entre los dos exports

| | 105 chats | 123 chats | |
|---|---:|---:|---|
| Pedidos creados | 8 | **10** | +2 |
| Pedidos confirmados | 1 | **1** | sin cambio |
| Chats con el precio vacío | 73% | **77%** (95) | peor |
| Chats con `IA: sin créditos` | 36% | **29%** (36) | sigue |
| Mensajes bot / cliente | 1.9x | **1.99x** (835 / 419) | sigue |

**9 de los 10 pedidos creados están en `falta_pago`.** El único confirmado es el mismo de siempre (chat 89, Hugo).

---

## 2. Qué arreglaron los 25 commits del 03/09

Los commits del día son de paneles y logística: *«Corrigió métricas del bot»*, *«Ajustó métricas de fases»*, *«Corrigió lógica de courier»*, *«Agregó exportador de chats»*, *«Corrigió botones de voucher»*, *«Bloqueó validación en contraentrega»*, *«Creó pedidos pendientes»*.

**Ninguno tocó los defectos de conversación.** Verificado contra la configuración viva, después de los 25 commits:

| Defecto | Estado ahora |
|---|---|
| `{{precio}}` sin resolver en las secuencias de 1 h y 6 h | **Sigue.** La de 1 h se editó hoy 18:44 y quedó igual |
| `confirmation_required_fields` = `{nombre, coordenadas, telefono}` | **Sin cambio.** No pide dirección, DNI ni cantidad |
| `reglas_prohibidas` | **Vacío.** Cero guardarraíles |
| Secuencias segmentadas por `etapa` | **0 de 18.** Todas en `__sin_confirmar__` |
| Créditos de IA | **Sigue.** 36 chats degradados, 06:00–08:00 |

---

## 3. Lo nuevo que aparece en este export

### 3.1 RIESGO ALTO — el bot convierte síntomas en venta cruzada

En 5 chats el bot toma un síntoma que el cliente describe y lo usa para vender una **Crema Natural para Neuropatía**:

> *«Entiendo, esa molestia suele relacionarse con los niveles de glucosa»* — chat 3
> *«El entumecimiento suele relacionarse con la glucosa alta, y Glucora apoya a regularla **para evitar que avance**»* — chat 105
> *«Ese ardor en los pies es súper común cuando hay temas de azúcar»* — chat 96

Eso es un diagnóstico implícito más una promesa de frenar la progresión de una neuropatía diabética. **Es lo más delicado de todo el export y ningún informe lo detectó.**

### 3.2 El manejo de salud es inconsistente, no uniformemente malo

11 chats donde el cliente declara diabetes, insulina o metformina:

- **Bien (3):** chats 81, 86, 88 — *«nunca debes suspender ni modificar tu insulina/metformina»*.
- **Excelente (1):** chat 30 — pie diabético hinchado → *«acude a un médico o a emergencias de inmediato… no podemos dar diagnósticos médicos»*. **Este es el comportamiento a convertir en regla.** (Aunque más adelante, en ese mismo chat, le ofrece la crema.)
- **Mal (1):** chat 64 — a un diabético tipo 2: *«La Berberina es de los extractos naturales más respaldados para ayudar al metabolismo de la glucosa y **la sensibilidad a la insulina**»*.
- **Silencio (4):** chats 80, 99, 112, 118 — el cliente declara su diabetes y **el bot no responde nada**.

La diferencia entre el chat 30 y el 64 no es el prompt: es el azar. Con `reglas_prohibidas` vacío no hay nada que fuerce la respuesta correcta.

### 3.3 El bot inventa la fórmula del producto

El nombre oficial dice «Berberina y Cúrcuma». Lo que el bot dice, por chat:

| Ingrediente | Chats |
|---|---:|
| Berberina | 122 |
| Cúrcuma | 122 |
| Canela | 41 |
| Gymnema | 25 |
| Cromo | 16 |
| Melón amargo | 5 |

Cuatro composiciones distintas para el mismo frasco. Los precios, en cambio, sí son consistentes: S/79 · S/109 · S/129.

### 3.4 El cierre sigue sin existir

- **43 chats** reciben *«¿cuántas unidades te gustaría?»*
- **12 chats** reciben una petición de nombre completo, DNI o dirección
- **37 chats** reciben la pregunta de cantidad y **nunca** llegan a que les pidan los datos

De los 10 pedidos creados, en **5 el bot nunca pidió el adelanto** y en **8 nunca pidió nombre completo ni DNI**.

### 3.5 El bot habla solo

- **71% de los chats (87 de 123) terminan con 3 o más mensajes del bot sin respuesta.** Racha máxima observada: 7 seguidos.
- De los 325 disparos de rompevisto identificados, **120 (37%) salieron a menos de 25 minutos del último mensaje del cliente** — con la conversación viva. El mínimo fue **1 minuto**.
- **12 chats** donde el bot se despide y pregunta algo en el mismo mensaje:
  > *«¡Que tengas un excelente día! 🙌 ¿A qué ciudad y distrito sería el envío?»* — chat 2

### 3.6 Contradicción de envío
*«Envío incluido»* aparece en 95 chats y *«envío gratis»* en 25, mientras `adelanto_agencia` cobra **S/20** por adelantado. Los 9 pedidos varados en `falta_pago` son exactamente los clientes a quienes se les prometió envío gratis y después se les pidió S/20.

---

## 4. Lo que este export confirma del plan, y lo que cambia

**Confirma:** el orden de las fases era correcto. Los 25 commits del día fueron a paneles y no movieron la conversión, porque el problema no está en los paneles.

**Cambia dos cosas:**

1. **Fase 1.1** ya no es «apagar Verrucure». Es **reducir las 9 secuencias de Glucora a 3–4** y añadir la regla de no disparar si el cliente escribió hace menos de 20 minutos (hoy el 37% viola eso).
2. **Sube de prioridad el guardarraíl de salud.** Estaba en Fase 3; con la venta cruzada de la crema sobre síntomas de neuropatía, pasa a ir junto con la Fase 1. Es riesgo, no conversión, y `reglas_prohibidas` está vacío: es un campo de texto, se llena en minutos.

**Regla concreta a escribir en `reglas_prohibidas`:**
> Prohibido afirmar que el producto regula, baja o estabiliza la glucosa. Prohibido relacionar un síntoma que describa el cliente con una causa médica. Prohibido ofrecer otro producto a partir de un síntoma. Ante cualquier mención de diabetes, insulina, metformina o embarazo: entregar el descargo médico y no cerrar la venta.

---

*Cifras obtenidas del export de 123 chats y de consultas de solo lectura a la base de producción. No se modificó nada.*
