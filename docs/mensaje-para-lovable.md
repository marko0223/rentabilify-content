# Mensaje para el agente de Lovable — revisar antes de enviar

**Proyecto:** `rentabilify` (`f07cabe8-35ce-4164-b1b0-1daca62e1ba1`)
**Recomendación:** enviarlo primero en **modo plan** (sin editar código) para ver qué propone, y recién después aprobar la ejecución.
**Alcance:** solo el bot de confirmación. **Cero cambios en rompevistos.**
**Clave:** el punto 0 obliga a *inventariar y proponer* la consolidación. No borra ni aplica nada: la decisión de qué se quita es tuya.

---

## Texto exacto a enviar

---

### ⛔ RESTRICCIÓN ABSOLUTA — LEE ESTO PRIMERO

**NO modifiques, edites, desactives, reordenes ni toques de ninguna forma la tabla `crm_followup_sequences` ni ninguna secuencia de seguimiento (rompevistos) de ninguna tienda.**

Están funcionando y reviven leads. Cualquier cambio ahí —incluido cambiar el texto de una plantilla, su `activo`, su `orden` o su `producto_id`— rompe algo que hoy da resultado. Si crees que un problema se resuelve tocando un rompevisto, **no lo toques: descríbelo en tu respuesta y déjalo pendiente.**

### ⛔ SEGUNDA RESTRICCIÓN — NO BORRES NADA

**No elimines ninguna instrucción, regla, prompt ni fragmento de texto existente**, aunque encuentres que se contradicen entre sí. Ni en `ai_system_prompt`, ni en `crm_ai_prompts`, ni en `crm_bot_modules`, ni en `reglas_obligatorias` / `reglas_prohibidas`, ni en el código.

Cuando detectes una contradicción: **repórtala, dime cuál creo que debería ganar y por qué, y déjala como está.** Yo decido qué se quita. Nada de limpiezas por iniciativa propia.

Todo lo que sigue se resuelve en el bot: `crm-ai-autoresponder`, `_shared/promptBuilder.ts`, `crm-process-incoming`, `whatsapp-webhook` y `crm_bot_settings`.

---

### 0. ANTES DE AÑADIR NADA: consolidar lo que ya existe

Esto es condición previa a todo lo demás. **No agregues ni una sola instrucción nueva encima de las que ya hay.** Hoy las instrucciones del bot están repartidas en al menos 8 fuentes que suman más de 31.000 caracteres y se contradicen entre sí:

| Fuente | Tamaño |
|---|---|
| `crm_bot_settings.ai_system_prompt` | 22.304 caracteres, 160 líneas |
| `crm_ai_prompts` | 4 filas, 7.058 caracteres |
| `crm_bot_modules` | 3 filas, 2.162 caracteres |
| `reglas_obligatorias` / `reglas_prohibidas` | campos sueltos |
| `prompt_config` (toggles) | JSON |
| Textos fijos en `crm-ai-autoresponder` y `_shared/promptBuilder.ts` | en código |

Solo en `ai_system_prompt` ya hay **16 reglas negativas** («NUNCA», «Prohibido», «JAMÁS») y **8 imperativas** («SIEMPRE», «DEBES», «OBLIGATORIO»). Añadir diez más encima garantiza que se choquen y que el bot elija cuál obedecer al azar — que es exactamente lo que se ve en los chats: el mismo caso resuelto bien en un chat y mal en otro.

**Ejemplo confirmado de contradicción:** «envío gratis / envío incluido» aparece **4 veces dentro de `ai_system_prompt`**, mientras `adelanto_agencia` cobra S/20 de flete. Si le agrego la regla «no digas envío gratis en agencia» sin borrar esas 4, quedan dos instrucciones opuestas compitiendo.

**Lo que necesito, en este orden:**

1. **Inventario.** Lista todas las fuentes de instrucción que llegan al modelo en una ejecución real, con su tamaño y de dónde salen.
2. **Volcado real.** Reconstruye leyendo el código el prompt final **tal como se ensambla y se envía al modelo** en una ejecución real, no el texto guardado. Pégamelo completo.
3. **Auditoría de choques.** Lista las instrucciones duplicadas y las que se contradicen. Empieza por las 4 menciones de envío gratis.
4. **Propuesta de consolidación — descrita, NO aplicada.** Muéstrame cómo quedaría todo en **un solo prompt** sin duplicados, pero **no lo escribas ni lo guardes todavía**. Quiero leer la propuesta antes. Usa esta jerarquía de precedencia:
   1. Guardarraíles de seguridad y salud — en código, no editables por la tienda
   2. Estado real del pedido y slots ya capturados — datos, no texto
   3. Toggles de la tienda: modalidad, adelanto, datos requeridos
   4. Ficha del producto: ingredientes, dosis, precios
   5. Tono y redacción del dueño de la tienda
5. **Se arma en cada ejecución (propuesta).** Hoy `ai_system_prompt` es una foto congelada que solo se regenera al pulsar Guardar, así que los toggles se desfasan del texto. Explícame cómo lo harías para que se construya en cada ejecución desde la configuración vigente. No lo implementes aún.
6. **Vista «Prompt vigente» (propuesta).** Un panel de solo lectura en Instrucciones del bot que muestre el prompt exacto que se está usando ahora mismo. Descríbelo, no lo construyas todavía.

**Regla de trabajo para todo lo que sigue: no agregues instrucciones nuevas encima de las viejas sin avisarme, y no borres las viejas. Si una regla nueva choca con una existente, dímelo y espera mi decisión.**

---

### Contexto

Analicé 123 chats reales de KITO STORE (Glucora Berberina, campaña CTWA, últimos 7 días). 10 pedidos creados, 1 confirmado. Estos son los defectos verificados, en orden de importancia.

---

### 1. Los saltos de línea se pierden al enviar

Caso real (chat de Vilma, +51973424052). El bot envió esto en un solo párrafo corrido:

> Hola Vilma! El precio es: 1 unidad x S/ 79 2 unidades x S/ 109 (la más vendida) 3 unidades x S/ 129 Te lo enviamos por Shalom a Chiclayo…

Los precios quedan pegados: «S/ 79 2 unidades» se lee como «79 2». Es ilegible en un teléfono.

El mismo bot en otros chats sí manda listas con saltos de línea, así que no es el prompt: hay un punto del pipeline de envío que colapsa los `\n`. **Encuéntralo y corrígelo.** Revisa la normalización de texto entre la respuesta del modelo y la llamada a la API de WhatsApp.

Además, como regla de redacción en el prompt: una idea por línea, cada precio en su propia línea, y máximo 4–5 líneas por mensaje.

---

### 2. El bot repregunta un dato que ya tiene (el bug más caro)

En el mismo chat de Vilma, el bot: resolvió Chiclayo → dijo que va por Shalom a Chiclayo → listó las 3 terminales **de Chiclayo** → y cerró el mensaje con:

> ¿A qué ciudad y distrito sería el envío? Así verifico la cobertura 📍

Se contradice dentro del mismo mensaje. Esto pasa porque **el CTA de la fase se concatena al final de la respuesta sin verificar si el dato ya está capturado**.

**Dato verificado:** la frase «¿A qué ciudad y distrito sería el envío?» **no está en `ai_system_prompt`, ni en `crm_ai_prompts`, ni en `crm_bot_modules`** (0 coincidencias en las tres). Está **hardcodeada en el código** de la edge function. Por eso ninguna instrucción de prompt la va a eliminar: hay que encontrarla en `crm-ai-autoresponder` / `_shared/promptBuilder.ts` y condicionarla al estado de los slots.

**Qué necesito:**

1. Un registro de slots por conversación (donde ya exista, úsalo; si no, créalo):
   `producto · cantidad · departamento · provincia · distrito · modalidad · nombre_completo · direccion · referencia · terminal · dni`
   El `telefono` ya viene de WhatsApp: nunca se pregunta.
2. **Antes de anexar cualquier CTA o pregunta, comprobar si ese slot ya tiene valor. Si lo tiene, no se anexa.**
3. **Una sola pregunta por mensaje, y siempre la del primer slot vacío.**
4. `modalidad` se **deriva** de la cobertura resuelta. Nunca se pregunta. El bot la informa como un hecho: «A Chiclayo va por agencia Shalom».

También hay 12 chats donde el bot se despide y pregunta algo en el mismo mensaje («¡Que tengas un excelente día! 🙌 ¿A qué ciudad y distrito sería el envío?»). Misma causa.

---

### 3. Guardarraíles de salud — esto es riesgo legal, no conversión

`crm_bot_settings.reglas_prohibidas` está **vacío** para esta tienda. Resultado en los chats reales:

- En 5 chats el bot toma un síntoma que describe el cliente y lo usa para vender **otro producto** (una crema para neuropatía):
  «El entumecimiento suele relacionarse con la glucosa alta, y Glucora apoya a regularla **para evitar que avance**».
  Eso es un diagnóstico implícito más una promesa de frenar una neuropatía diabética.
- A un diabético tipo 2 le dijo que la berberina ayuda «la **sensibilidad a la insulina**».
- En **4 chats el cliente declara que es diabético y el bot no responde absolutamente nada**.

**Estas reglas deben inyectarse SIEMPRE desde el código, por encima de la configuración de la tienda. No pueden depender de que el dueño las escriba en un campo de texto:**

- Prohibido afirmar que el producto regula, baja, controla o estabiliza la glucosa o el azúcar.
- Prohibido relacionar un síntoma que describa el cliente con una causa médica.
- Prohibido ofrecer otro producto a partir de un síntoma.
- Prohibido prometer que evita, frena o revierte la progresión de una condición.
- Ante cualquier mención de diabetes, insulina, metformina o embarazo, incluir textualmente:
  *«Glucora es un suplemento natural de apoyo, no reemplaza ni modifica tu tratamiento médico. Consúltalo con tu médico antes de empezar 🙌»*
- Si el cliente menciona **insulina o embarazo**: pausar el bot y escalar a humano.
- **Nunca dejar sin respuesta un mensaje donde el cliente declara una condición de salud.**

Referencia de lo que sí está bien: en un chat una clienta describió un pie diabético hinchado y el bot respondió «acude a un médico o a emergencias de inmediato… no podemos dar diagnósticos médicos». **Ese es el comportamiento correcto; conviértelo en regla, hoy ocurre por azar.**

---

### 4. Datos requeridos por modalidad

Hoy `confirmation_required_fields` es `{nombre, coordenadas, telefono}`. Por eso el bot casi nunca pide lo que hace falta: de 123 chats solo 12 vieron una petición de nombre, DNI o dirección.

Cámbialo a una configuración **por modalidad**, y actualiza también la pantalla de Instrucciones del bot para poder editarla:

- **COD:** `nombre_completo`, `direccion`, `referencia`, `distrito`, `cantidad`
- **AGENCIA:** `nombre_completo`, `dni`, `terminal`, `cantidad`
- **Nunca:** `telefono` (ya lo tenemos de WhatsApp)

---

### 5. Coherencia entre envío y adelanto

En 95 chats el bot dice «envío incluido» y en 25 «envío gratis», mientras `adelanto_agencia` está activo con S/20 de flete. Los 9 pedidos varados en `falta_pago` son exactamente esos clientes.

**Regla:** cuando la cobertura resuelta sea AGENCIA y `adelanto_agencia.enabled` sea true, el bot **no puede** decir envío gratis ni envío incluido. Debe decir el monto del flete, el total y el saldo a pagar al recoger.

---

### 6. El bot inventa la composición del producto

El producto se llama «Berberina y Cúrcuma», pero entre chats el bot menciona canela (41 chats), gymnema (25), cromo (16) y melón amargo (5). Cuatro fórmulas distintas para el mismo frasco. Los clientes preguntan si es original.

**Regla:** ingredientes, dosis, presentación, duración y contraindicaciones se responden **únicamente** desde la ficha del producto en la base. Si el dato no está registrado, el bot dice que lo confirma y no lo inventa.

---

### 7. Terminales de agencia

Cuando ya se resolvió la ciudad: mostrar como máximo 3 terminales, **solo de esa ciudad**, y pedir que el cliente confirme una. Si hay una sola, proponerla y pedir confirmación. Nunca listar terminales y a continuación volver a preguntar la ciudad.

---

### 8. Cierre asumido

Hoy el bot pregunta «¿cuántas unidades te gustaría?» en 43 chats; 37 de esos nunca llegan a dar sus datos.

Cámbialo: cuando la ubicación esté resuelta y no haya objeción abierta, **asumir el pack de 2 y pedir los datos**:

> Te dejo separadas las 2 unidades a S/ 109 (es la más pedida).
> Pásame estos datos y lo despacho hoy:
> 1) Nombre completo
> 2) Dirección exacta + referencia

Y en agencia, apenas se crea el pedido, el bot debe pedir el adelanto en ese mismo momento: motivo, total, adelanto y saldo, más las cuentas de pago deduplicadas desde la configuración. Hoy de 10 pedidos creados, en 5 el bot nunca pidió el adelanto.

---

### 9. Créditos de IA agotados

36 de 123 chats tienen la nota `💳 IA: sin créditos`, concentrados entre las 06:00 y las 08:00, que es la hora pico de entrada. Un lead que espera 16 minutos su primera respuesta ya cerró WhatsApp.

Añade: alerta cuando el saldo baje del 20%, y un fallback de primera respuesta con plantilla fija cuando la IA no esté disponible, para que nadie quede sin contestar.

---

### 10. Investigación (no ejecutes cambios aquí)

Al editar una secuencia de seguimiento, parece que se re-dispara a leads antiguos. Existe la columna `aplicar_desde` en `crm_followup_sequences` que debería evitarlo.

**Solo investiga y explícame qué encontraste. No modifiques ninguna secuencia ni su configuración.** Si el problema está en el runner que las ejecuta (no en las secuencias en sí), dime exactamente dónde y qué propones.

---

### Cómo quiero la entrega

- **Esta primera ronda es solo de análisis. No escribas ni modifiques código todavía.** Los puntos 1 al 10 son el contexto de a dónde vamos; en esta respuesta solo quiero el punto 0 y tu diagnóstico de los demás.
- Entrégame: inventario de fuentes, volcado del prompt real ensamblado, lista de contradicciones y propuesta de consolidación. Nada aplicado.
- Cuando apruebe, iremos de a un cambio por vez, empezando por el **1** (saltos de línea) y el **2** (no repreguntar), que son los que se ven en cada chat.
- El **3** (guardarraíles de salud) va en el mismo lote porque es riesgo.
- Las reglas duras se inyectan en cada ejecución desde el código; no dependen del texto guardado.
- Confírmame al final, explícitamente, dos cosas: que no tocaste ningún rompevisto y que no borraste ninguna instrucción existente.

---

## Nota para mí (no va en el mensaje)

El bug del `{{precio}}` vacío —95 de 123 chats— **vive en dos rompevistos** (las secuencias de 1 h y 6 h de Glucora). Queda fuera de este mensaje por la restricción. Es un solo campo de texto en cada una; si en algún momento decides arreglarlo, conviene hacerlo a mano desde la pantalla de seguimientos y vigilar si al guardar se re-disparan leads antiguos — que es justo lo que pide investigar el punto 10.
