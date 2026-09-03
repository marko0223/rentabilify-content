# Plan de reemplazo del prompt de confirmación WhatsApp

**Dos principios de este plan:**

1. **No se añade nada. Se borra todo y se escribe de nuevo.** Hoy hay 31.000+ caracteres repartidos en 8 fuentes que se contradicen. El objetivo es **un solo prompt** que el bot pueda obedecer entero.
2. **El prompt es general, no de un producto.** Sirve para cualquier producto de cualquier tienda. Ni un nombre de producto, ni un precio, ni un registro sanitario entran en el prompt: todo eso se **inyecta** desde la ficha del producto y la configuración de la tienda.

---

## Parte 1 — Qué se aprende de los chats cerrados por un humano

38 mensajes del asesor en el export de 161 chats.

### Lo que SÍ se copia

| # | Regla | Evidencia |
|---|---|---|
| 1 | **Frases cortas y naturales.** Se escribe como quien atiende rápido, no como un folleto | «279 saldría» · «si fueran 6 le dejo a 199» |
| 2 | **Emojis, con naturalidad.** No son el problema; el folleto lo es | — |
| 3 | **Responde lo que preguntan y nada más.** Sin CTA pegado al final | Ninguno de los 38 mensajes del asesor lleva CTA anexado |
| 4 | **Un dato a la vez, diciendo para qué sirve** | «solo me faltaría tu DNI para poder enviarlo por Shalom» → el cliente responde el DNI en el acto |
| 5 | **Certezas concretas: día y franja horaria** | «Para Los Olivos el envío es mañana entre 10am y 5pm, es totalmente gratis y paga al recibir» |
| 6 | **Ante desconfianza: prueba, no insistencia** | «hacemos el envío ahora mismo y le envío su rótulo y su link de tracking para que no tenga ningún inconveniente» |
| 7 | **Responde la originalidad con el dato duro de la ficha** | Da el número de registro sanitario y adjunta la información del producto |
| 8 | **Corrige en vivo sin drama** | «disculpa, me dicen que hay otra promoción» |
| 9 | **Confirma antes de cerrar** | «está bien las 8 unidades a 229, ¿verdad?» |
| 10 | **Pide ubicación en tiempo real, no dirección escrita** | «¿me podría enviar su ubicación en tiempo real, por favor?» |
| 11 | **Si promete material, lo adjunta** | Cuando prometió el video, lo mandó |

### Lo que NO se copia — el humano se salió de las reglas

En el chat 56 el asesor **improvisó precios** (4×159, 6×199, 8×229, 10×279) y **un adelanto inventado** («a partir de las 4 unidades pedimos S/30»). Eso no es el modelo a seguir: fue saltarse las reglas para rescatar la venta.

**Pero revela un hueco real del sistema.** La clienta preguntó «4 x cuánto» y el bot produjo esto:

> «S/ 79 por la primera unidad y S/ 109 por el pack de 2, más una unidad adicional a S/ 79»

Una cuenta sin sentido, porque **no existe una tabla oficial de precios por volumen**. El humano tuvo que inventarla en vivo.

**La conclusión no es "que el bot negocie".** Es al revés: **el bot nunca debe inventar un precio.** Lo que hay que arreglar es el dato — definir la tabla oficial de volumen en la ficha del producto — y que el prompt prohíba calcular precios que no estén en esa tabla.

### Lo que el humano nunca hace
- No se despide y pregunta en el mismo mensaje.
- No promete material que no adjunta.
- No repite el nombre completo del producto en cada mensaje.
- No manda tres mensajes seguidos sin respuesta.
- No dice «te ayuda a apoyar tu bienestar metabólico».

---

## Parte 2 — Qué se borra antes de escribir

| Qué | Dónde | Por qué |
|---|---|---|
| Los 22.304 caracteres de `ai_system_prompt` | `crm_bot_settings` | Se reemplaza entero |
| Las 4 filas de `crm_ai_prompts` (7.058 car.) | tabla aparte | Se absorben o se descartan |
| Las 3 filas de `crm_bot_modules` (2.162 car.) | tabla aparte | Ídem |
| `adelanto_agencia.mensaje` = «el pago del **flete** por adelantado» | `crm_bot_settings` | Contradice el envío gratis. El adelanto no es flete |
| El CTA hardcodeado «¿A qué ciudad y distrito sería el envío?» | código de la edge function | Se anexa por fuera y contradice al propio mensaje |
| Afirmaciones terapéuticas en `productos.beneficios` | ficha del producto | Se inyectan en cada chat y pelean contra el guardarraíl |

Nada se borra sin tu visto bueno, uno por uno.

---

## Parte 3 — El contexto que el sistema debe inyectar

El prompt no sabe nada del producto. Todo esto llega como datos en cada ejecución:

```
TIENDA          nombre · nombre del asesor · horario de despacho
PRODUCTO        nombre corto · presentación · precios y packs oficiales
                ficha: composición · modo de uso · registro sanitario
                procedencia · garantía · advertencias
                es_producto_de_salud: sí/no
PEDIDO          existe o no · campos que faltan para confirmar
COBERTURA       modalidad resuelta (contraentrega o agencia)
                plazo · franja horaria · terminales de esa ciudad
CONFIG          envío gratis sí/no · adelanto: aplica/monto/motivo
                datos requeridos por modalidad
```

**Si un dato no está inyectado, el bot no lo inventa: dice que lo confirma y no lo promete.**

---

## Parte 4 — El prompt nuevo, general (borrador)

```
Eres {asesor}, de {tienda}. Vendes por WhatsApp en Perú.
Trabajas con los datos que te llegan en el contexto. No inventas ninguno.

CÓMO ESCRIBES
Frases cortas. Máximo 4 o 5 líneas por mensaje.
Escribes como una persona que atiende rápido, no como un folleto.
Los emojis están bien, con naturalidad.
No repites el nombre completo del producto: usas su nombre corto.
Una sola pregunta por mensaje. Si te despides, no preguntas nada más.

QUÉ HACES EN CADA MENSAJE
1. Respondes exactamente lo que te preguntaron. Nada más.
2. Si queda una duda abierta, no avanzas a la venta.
3. Si no tienes un dato en el contexto, dices que lo confirmas. Nunca dices
   que lo vas a consultar y luego no vuelves.
4. Nunca prometes una foto, video o documento que no adjuntes en ese mismo
   mensaje.

PRECIOS
Solo los del contexto. Si te piden una cantidad que no está en la lista,
NO calculas ni improvisas: ofreces la opción más cercana que sí existe, o
dices que consultas ese precio y pasas la conversación a una persona.
Nunca dices "el precio es fijo". Nunca inventas un descuento.

UBICACIÓN Y PEDIDO
En cuanto sepas el distrito o la ciudad, CREAS EL PEDIDO con lo que tengas.
Después pides solo los campos que el pedido marque como faltantes,
UNO POR MENSAJE, diciendo para qué sirve cada uno.
  "solo me faltaría tu DNI para poder enviarlo por {logistica}"
Si ya tienes un dato, no lo vuelves a pedir: lo confirmas en media línea.
Si dices que anotaste algo, tiene que estar guardado en el pedido.

ENTREGA
Das certezas concretas, con el plazo y la franja del contexto.
  Contraentrega: "el envío es {plazo} entre {franja}, y pagas al recibir"
  Agencia: la agencia, el plazo y hasta 3 terminales de ESA ciudad
Pides la ubicación en tiempo real por el botón de WhatsApp.

COBRO
Solo pides adelanto si el contexto dice que aplica, por el monto que diga
y con el motivo que diga. No inventas umbrales ni montos.
Si el envío es gratis, el adelanto nunca se llama flete ni costo de envío.

DESCONFIANZA
Respondes con el dato de la ficha, no con adjetivos.
Ofreces prueba, no insistencia: el rótulo de envío y el link de tracking.
Y el argumento que cierra: paga cuando lo tiene en la mano.

SALUD (cuando el producto sea de salud o el cliente cuente una condición)
No dices que el producto cura, regula, baja ni controla nada.
No relacionas ningún síntoma que te cuenten con una causa médica.
No ofreces otro producto a partir de un síntoma.
Solo dices de la composición y el uso lo que esté en la ficha.
Si mencionan una condición, un medicamento o un embarazo, incluyes que el
producto es un apoyo y no reemplaza ni modifica un tratamiento médico, y
que lo consulten con su médico.
Si mencionan insulina o embarazo, pasas la conversación a una persona.
Nunca dejas sin responder un mensaje donde alguien cuenta algo de su salud.

CUÁNDO CALLARTE
Si dicen que lo van a pensar, consultar, o que están ocupados: respondes
una vez, corto, y no insistes.
Nunca mandas más de 2 mensajes seguidos sin respuesta.
```

Unos 2.700 caracteres frente a 22.304, y **sin una sola mención de un producto concreto**. Todo lo que no está aquí, no existe.

---

## Parte 5 — Datos por definir (por producto, no en el prompt)

| # | Dato | Estado |
|---|---|---|
| 1 | Contenido: **30 ml** | ✅ confirmado |
| 2 | ¿Lleva cúrcuma? | ⏳ el nombre dice que sí, la descripción no la menciona |
| 3 | **Tabla oficial de precios por volumen** | ⏳ hoy no existe; por eso el bot calculó mal |
| 4 | Registro sanitario: **DIGESA P2721426N** | ✅ falta cargarlo |
| 5 | Procedencia (país y fabricante) | ⏳ está en la etiqueta del frasco y en el expediente DIGESA |
| 6 | Reglas oficiales de adelanto por modalidad | ⏳ las actuales se contradicen con el envío gratis |

---

## Parte 6 — Orden de trabajo

| # | Paso | Tipo |
|---|---|---|
| 1 | Definir los datos de la Parte 5 | Tú |
| 2 | Corregir la ficha del producto y quitar las afirmaciones terapéuticas | Datos |
| 3 | **Crear el pedido al resolver la ubicación** | Código — el de mayor impacto |
| 4 | Quitar el CTA hardcodeado de la edge function | Código |
| 5 | Inyectar el contexto de la Parte 3 en cada ejecución | Código |
| 6 | Reemplazar el prompt entero | Texto |
| 7 | Borrar `crm_ai_prompts`, `crm_bot_modules` y la frase del flete | Datos |
| 8 | Medir contra el mismo export | — |

**Rompevistos: no se tocan en ningún paso.**
