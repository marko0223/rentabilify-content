# Cómo se vincula el prompt nuevo con el panel de instrucciones, y comparativa con el viejo

---

# Parte A — La buena noticia: el panel ya es genérico

`prompt_config` **ya está bien diseñado**. Tiene ramas separadas por modalidad, datos requeridos por modalidad, tono, emojis permitidos, política de descuento, cuentas, courier preferido. No hay que rediseñar el panel: hay que **hacer que el prompt lo obedezca**.

El cambio de concepto es este:

> Hoy el prompt **repite** lo que el panel ya dice, con otras palabras y a veces al revés.
> El prompt nuevo **no contiene datos**: es una plantilla que renderiza el panel.

## Mapa: qué campo del panel alimenta qué parte del prompt

| Bloque del prompt | Se llena desde |
|---|---|
| Identidad (`{asesor}`, `{tienda}`) | `common.asesor_nombre`, `common.tienda_nombre` |
| CÓMO ESCRIBES | `common.tono` · `longitud` · `usar_emojis` · `emojis_permitidos` · `conversar_natural` · `separar_mensajes` · `llamar_por_nombre` · `forbidden_phrases` |
| PRECIOS | ficha del producto + `common.politica_descuento` + `mensaje_no_descuento` |
| UBICACIÓN Y PEDIDO | `cod.required_fields` / `agencia.required_fields` + `rules.ask_dni_if_agencia` |
| ENTREGA | `cod.tipo_envio` · `costo_envio` · `agencia.courier_preferido` · `sugerir_terminales_cercanas` + cobertura resuelta |
| COBRO | `agencia.cobro` · `adelanto_cod` / `adelanto_agencia` · `cuentas_bancarias_estructuradas` |
| DESCONFIANZA | ficha: registro sanitario, procedencia, garantía |
| SALUD | ficha: `es_producto_de_salud` |
| Reglas propias de la tienda | `reglas_obligatorias` / `reglas_prohibidas` |

## Los tres niveles (esto es lo que lo hace adaptable a cualquier producto)

**1. Fijo en código — ninguna tienda lo edita**
Guardarraíles de salud · no inventar datos · una pregunta por mensaje · no repreguntar un dato ya capturado · no prometer material que no se adjunta · tope de mensajes sin respuesta · crear el pedido al resolver la ubicación.

**2. Configurable por tienda — el panel actual**
Nombre, tono, emojis, modalidades activas, datos requeridos por modalidad, adelanto, cuentas, política de descuento, courier, reglas propias.

**3. Por producto — la ficha**
Nombre corto, presentación, precios y packs, composición, modo de uso, registro sanitario, procedencia, garantía, advertencias, `es_producto_de_salud`.

Cambiar de producto = cambiar la ficha. Cambiar de tienda = cambiar el panel. **El prompt no se toca nunca.**

## Lo que hay que arreglar en el panel para que esto funcione

### Cuatro fuentes para «datos requeridos», y no coinciden

| Fuente | Campos |
|---|---|
| `prompt_config.cod.required_fields` | nombre, distrito, teléfono, dirección, referencia, departamento, ubicación_whatsapp |
| `prompt_config.agencia.required_fields` | dni, ciudad, nombre, teléfono, terminal, departamento |
| `prompt_config.required_fields` (nivel raíz) | nombre, teléfono, dirección, distrito, provincia, departamento, producto, cantidad |
| Columna `confirmation_required_fields` | **nombre, coordenadas, teléfono** |

Las dos primeras están bien pensadas y son las que hay que conservar. **Las otras dos son ruido y hay que eliminarlas.** Y `auto_confirm_when_complete` está en `true`: si se evalúa contra la columna de tres campos, el sistema da por completo un pedido al que le falta casi todo.

### Contradicciones a resolver

| Contradicción | Decisión propuesta |
|---|---|
| `bot_name: "Asistente"` vs `asesor_nombre: "Ale"` | Dejar solo `asesor_nombre` |
| `tone: "cercano"` vs `common.tono: "casual"` vs `language` | Un solo campo de tono |
| `adelanto_agencia.mensaje` dice «el pago del **flete** por adelantado» | Reescribir: el adelanto no es flete |
| `common.no_dar_fechas_exactas: true` | **Apagar** (ver Parte B) |
| `mensaje_no_descuento`: «El precio es fijo, no manejamos descuentos» | Cambiar por: solo existen los packs configurados |

---

# Parte B — Comparativa: prompt viejo vs prompt nuevo

**Antes de nada, una corrección a lo que dijimos:** el prompt viejo **no es basura**. Al leerlo entero, buena parte de sus reglas son correctas y dicen justo lo que queremos. El problema es otro.

## Lo que el viejo ya hace bien (y el nuevo conserva)

| Regla del prompt viejo | |
|---|---|
| «NO inventes precios, productos, plazos ni datos. Usa SOLO el contexto» | ✅ ya existía |
| «Los ÚNICOS precios válidos son el del pedido vinculado o el de la ficha» | ✅ ya existía |
| «PROHIBIDO redondear, estimar, deducir por categoría o inventar» | ✅ ya existía |
| «SOLO puedes mencionar promos que estén configuradas» | ✅ ya existía |
| «Solo reconoce ubicaciones del país de la tienda» | ✅ ya existía |
| «En contraentrega el cliente paga TODO al recibir. PROHIBIDO pedir adelanto» | ✅ ya existía |
| «Está PROHIBIDO repetir literal una respuesta ya dada» | ✅ ya existía |
| «Nunca uses presión agresiva, culpa ni urgencia falsa» | ✅ ya existía |

**La regla de no inventar precios ya estaba escrita — y aun así el bot calculó «S/79 + S/109 + S/79».** Ese es el diagnóstico real: no faltan reglas, sobran. En 160 líneas el modelo obedece a unas y se olvida de otras.

## Las tres reglas del viejo que están matando la venta

| # | Lo que dice el prompt viejo | Qué provoca |
|---|---|---|
| 1 | «**JAMÁS** digas un tiempo concreto de entrega (ni minutos, ni horas, ni 'hoy', ni 'mañana')» (líneas 26, 63, y el toggle `no_dar_fechas_exactas`) | El humano cierra diciendo «el envío es mañana entre 10am y 5pm, gratis, pagas al recibir». **El prompt se lo prohíbe al bot.** |
| 2 | «Antes de aceptar un 'no', haz **MÍNIMO 2 intentos de retención**» (línea 37) | Es la orden explícita que produce el monólogo: 73% de chats mueren con 3+ mensajes del bot sin respuesta |
| 3 | «El precio es fijo, no manejamos descuentos» (`mensaje_no_descuento`) | Muro seco ante la pregunta de volumen. El humano tuvo que entrar a rescatar la venta |

Ninguna de las tres es un bug: **están configuradas así a propósito.** Por eso ningún arreglo de código las iba a tocar.

## Comparativa de estructura

| | Prompt viejo | Prompt nuevo |
|---|---|---|
| Tamaño | 22.304 caracteres · 160 líneas | ~2.700 caracteres |
| Fuentes de instrucción | 8 (prompt, 4 filas de prompts, 3 módulos, config, código) | 1 |
| Reglas negativas | 16 «NUNCA/PROHIBIDO/JAMÁS» | 12, sin duplicados |
| Datos de producto dentro | Sí (precios, Shalom, adelanto de 20) | **Ninguno** — se inyectan |
| Nombre de tienda dentro | Sí («Ale de Kito Store») | `{asesor}` / `{tienda}` |
| Sirve para otro producto | No, hay que reescribirlo | Sí, sin tocarlo |
| Se regenera | Solo al pulsar Guardar (foto congelada) | En cada ejecución |
| Crear el pedido al detectar ubicación | No lo menciona | Sí, es el eje |
| Guardarraíles de salud | No existen | Fijos en código |
| Da fechas y franjas | **Prohibido** | Sí, del contexto |
| Insistencia | Mínimo 2 intentos obligatorios | Máximo 2 mensajes sin respuesta, y para |

## Lo que no tiene ninguno de los dos y hay que añadir

- Crear el pedido al resolver la ubicación (el motor de recolección de datos).
- Guardarraíles de salud inyectados desde código.
- Prohibición de prometer material que no se adjunta.
- Tabla oficial de precios por volumen en la ficha.
- Registro sanitario y procedencia como datos consultables.

---

## Resumen en una línea

El panel ya sabe casi todo lo que hace falta; el prompt viejo también sabe la mitad. Lo que sobra es volumen y lo que falta es que **una sola fuente mande**. Y hay tres reglas configuradas a propósito —no dar fechas, insistir dos veces, no negociar— que hay que decidir si se quedan, porque son exactamente lo contrario de lo que hace el humano cuando cierra.
