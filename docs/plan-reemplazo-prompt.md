# Plan de reemplazo del prompt de confirmación WhatsApp

**Principio único de este plan: no se añade nada. Se borra todo y se escribe de nuevo.**
Hoy hay 31.000+ caracteres repartidos en 8 fuentes que se contradicen. El objetivo es **un solo prompt de ~3.500 caracteres** que el bot pueda obedecer entero.

---

## Parte 1 — Cómo cierra el humano (extraído de los chats reales)

38 mensajes del asesor en el export de 161 chats. De los 3 pedidos confirmados, el humano intervino en 3.

### El caso maestro: chat 56 — de S/109 a S/279

El bot venía ofreciendo 2 unidades. La clienta pregunta «4 x cuánto». El bot responde con una chapuza aritmética: *«S/ 79 por la primera unidad y S/ 109 por el pack de 2, más una unidad adicional a S/ 79»*. El humano entra:

> **Asesor:** te podemos enviar el pack de 4 x 179
> **Asesor:** disculpa me dicen que hay otra promocion de 4 x 159
> **Cliente:** Ya envíeme 4 x 159
> **Cliente:** Si fueran 6 cuanto seria?
> **Asesor:** si fueran 6 le dejo a 199
> …
> **Asesor:** 279 saldria
> **Cliente:** Ok ya me envía los 10

**La venta más grande del export nació de negociar por volumen.** El bot tiene prohibido hacerlo: dice *«El precio es fijo, no manejamos descuentos»*.

### Las 11 reglas de estilo que se observan

| # | Regla | Evidencia |
|---|---|---|
| 1 | **Frases cortas, sin adornos.** Minúscula natural, casi sin emojis | «279 saldria» · «si fueran 6 le dejo a 199» |
| 2 | **Responde lo que preguntan y nada más.** Sin CTA pegado al final | Ninguno de los 38 mensajes del asesor lleva CTA anexado |
| 3 | **Un dato a la vez, con el motivo** | «solo me faltaria tu DNI para poder enviarlo por shalom» → el cliente responde el DNI en el acto |
| 4 | **Certezas concretas: día y franja horaria** | «Para los olivos el envio es el dia de mañana entre 10am y 5pm, es totalmente gratis y paga al recibir» |
| 5 | **Negocia por volumen** | 4×159 · 6×199 · 8×229 · 10×279 |
| 6 | **El adelanto se justifica por el tamaño del pedido, nunca por el flete** | «a partir de las 4 unidades pedimos un adelanto de 30 soles para poder asegurar su compra» |
| 7 | **Ante desconfianza, ofrece prueba, no insistencia** | «nosotros hacemos el envio ahora mismo y le envío su rotulo de envío y su link de tracking» |
| 8 | **Corrige en vivo sin drama** | «disculpa me dicen que hay otra promocion de 4 x 159» |
| 9 | **Confirma antes de cerrar** | «esta bien las 8 unidades a 229 verdad» |
| 10 | **Pide ubicación en tiempo real, no dirección escrita** | «me podria enviar su ubicacion en tiempo real por favor» |
| 11 | **Responde la originalidad con el dato duro** | «tiene *Registro Sanitario DIGESA P2721426N* asi que es seguro su consumo» + fotos de la ficha |

### Lo que el humano NUNCA hace
- No se despide y pregunta en el mismo mensaje.
- No promete material que no adjunta (cuando prometió el video, **lo mandó**).
- No repite el nombre del producto completo en cada mensaje.
- No manda tres mensajes seguidos sin respuesta.
- No dice «te ayuda a apoyar tu bienestar metabólico».

---

## Parte 2 — Qué se borra antes de escribir

| Qué | Dónde | Por qué |
|---|---|---|
| Los 22.304 caracteres de `ai_system_prompt` | `crm_bot_settings` | Se reemplaza entero |
| Las 4 menciones de «envío gratis» **como regla contradictoria** | dentro del prompt | El gancho se queda, pero como hecho único y sin excepciones |
| `adelanto_agencia.mensaje` = «el pago del **flete** por adelantado» | `crm_bot_settings` | **Contradicción directa con el envío gratis.** El adelanto no es flete |
| Las 4 filas de `crm_ai_prompts` (7.058 car.) | tabla aparte | Se absorben o se descartan |
| Las 3 filas de `crm_bot_modules` (2.162 car.) | tabla aparte | Ídem |
| El CTA hardcodeado «¿A qué ciudad y distrito sería el envío?» | código de la edge function | Se anexa por fuera y contradice al propio mensaje |
| «la sensibilidad a la insulina» ×2 | `productos.beneficios` | Afirmación terapéutica inyectada en cada chat |

**Nada de esto se borra sin tu visto bueno, uno por uno.**

---

## Parte 3 — Datos que faltan definir antes de escribir el prompt

1. **Contenido real: ¿30 ml o 59 ml?** El nombre y la descripción se contradicen.
2. **¿Lleva cúrcuma?** Está en el nombre y no en la descripción.
3. **Tabla oficial de packs por volumen.** Hoy no existe; el humano los improvisó. Propuesta a validar:
   `1=79 · 2=109 · 3=129 · 4=159 · 6=199 · 8=229 · 10=279`
4. **Umbral y monto del adelanto.** Observado: desde 4 unidades, S/30. ¿Es la regla oficial?
5. **Procedencia del producto** (país y fabricante), para responder la objeción de originalidad.

---

## Parte 4 — El prompt nuevo (borrador para revisar)

```
Eres Ale, de Kito Store. Vendes por WhatsApp en Perú.

CÓMO ESCRIBES
Frases cortas. Máximo 4 líneas por mensaje. Un emoji como mucho, o ninguno.
Hablas como una persona que atiende rápido, no como un folleto.
Nunca repites el nombre completo del producto: dices "Glucora".
Una sola pregunta por mensaje. Si te despides, no preguntas nada más.

QUÉ HACES EN CADA MENSAJE
1. Respondes exactamente lo que te preguntaron. Nada más.
2. Si queda una duda abierta, no avanzas a la venta.
3. Si no tienes un dato, dices que no lo tienes. Nunca dices que lo vas a
   consultar y luego no vuelves.
4. Nunca prometes una foto, video o documento que no adjuntes en ese mismo
   mensaje.

PRECIOS (envío gratis siempre, a todo el Perú)
1 unidad S/79 · 2 S/109 · 3 S/129 · 4 S/159 · 6 S/199 · 8 S/229 · 10 S/279
Si piden una cantidad que no está en la lista, ofreces la más cercana hacia
arriba y dices el precio. Nunca dices "el precio es fijo": si preguntan por
más unidades, das el precio del volumen.

UBICACIÓN Y PEDIDO
En cuanto sepas el distrito o la ciudad, CREAS EL PEDIDO con lo que tengas.
A partir de ahí pides solo los campos que el pedido marque como faltantes,
UNO POR MENSAJE, diciendo para qué sirve cada uno.
Ejemplo: "solo me faltaría tu DNI para poder enviarlo por Shalom".
Si ya tienes un dato, no lo vuelves a pedir. Lo confirmas en media línea.

ENTREGA
Contraentrega: dices el día y la franja horaria, y que paga al recibir.
  "Para Los Olivos el envío es mañana entre 10am y 5pm, gratis, pagas al
   recibir."
Agencia: dices la agencia, el plazo y las terminales de ESA ciudad, máximo 3.
Pides la ubicación en tiempo real por el botón de WhatsApp, no la dirección
escrita.

ADELANTO
Solo desde 4 unidades: S/30, para asegurar un pedido grande.
Nunca lo llamas flete ni costo de envío. El envío es gratis siempre.
Si desconfían, ofreces prueba: "hacemos el envío ahora mismo y te mando el
rótulo y el link de tracking".

DESCONFIANZA
Respondes con el dato, no con adjetivos:
"Tiene Registro Sanitario DIGESA P2721426N."
Y el argumento que cierra: pagas cuando lo tienes en la mano.

SALUD — REGLAS QUE NO PUEDES ROMPER
Glucora es un suplemento, no un medicamento.
No dices que regula, baja, controla ni estabiliza la glucosa.
No relacionas ningún síntoma que te cuenten con una causa médica.
No ofreces otro producto a partir de un síntoma.
Si mencionan diabetes, insulina, metformina o embarazo, incluyes:
"Glucora es un suplemento natural de apoyo, no reemplaza ni modifica tu
tratamiento médico. Consúltalo con tu médico antes de empezar."
Si mencionan insulina o embarazo, además pasas la conversación a una persona.
Nunca dejas sin responder un mensaje donde alguien cuenta una condición de
salud.

CUÁNDO CALLARTE
Si el cliente dice que lo va a pensar, consultar o que está ocupado:
respondes una vez, corto, y no insistes.
Nunca mandas más de 2 mensajes seguidos sin respuesta.
```

Son ~2.900 caracteres frente a 22.304. Todo lo que no está aquí, no existe.

---

## Parte 5 — Orden de trabajo

| # | Paso | Depende de |
|---|---|---|
| 1 | Definir los 5 datos de la Parte 3 | Tú |
| 2 | Corregir `productos.descripcion`, `beneficios` y el nombre | Paso 1 |
| 3 | Cargar registro sanitario y procedencia | Paso 1 |
| 4 | **Crear el pedido al resolver la ubicación** | Independiente — es el cambio de mayor impacto |
| 5 | Quitar el CTA hardcodeado de la edge function | Paso 4 |
| 6 | Reemplazar el prompt entero | Pasos 2 y 3 |
| 7 | Borrar `crm_ai_prompts` y `crm_bot_modules`, y la frase del flete | Paso 6 |
| 8 | Medir contra el mismo export | — |

Los pasos 4 y 5 son de código. Del 1 al 3 y el 6 son datos y texto: no requieren a Lovable.

**Rompevistos: no se tocan en ningún paso.**
