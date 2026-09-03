# Auditoría del prompt viejo, línea por línea

161 líneas · 22.304 caracteres. Veredicto de cada una.

**Leyenda:** 🗑️ ELIMINAR · ✅ SE QUEDA (pasa al nuevo) · 📦 AL CONTEXTO (es un dato, no una regla)

---

## Corrección importante antes de empezar

Dije que el CTA «¿A qué ciudad y distrito sería el envío?» estaba **hardcodeado en la edge function**, porque la frase literal no aparecía en ninguna tabla de prompts. **Estaba equivocado.** La frase no está escrita, pero la **ordenan** estas dos líneas:

> **Línea 159:** «CADA mensaje que envíes debe terminar con UNA pregunta o una instrucción clara de qué hacer ahora. Está **PROHIBIDO** cerrar un turno con una frase informativa suelta ('listo', 'anotado', 'perfecto', 'excelente')»
>
> **Línea 154:** «**NUNCA** te quedes en 'te dejo anotadas las X unidades' sin preguntar la ciudad»

El modelo no la copia: **la compone porque se le ordena no terminar nunca sin pregunta.** Por eso salía pegada a las despedidas. Se arregla borrando estas líneas, no tocando código.

---

## Bloque 1 · Identidad y tono (líneas 1-6)

| # | Contenido | Veredicto |
|---|---|---|
| 1 | «Eres Ale de la tienda "Kito Store"… español adaptado a Perú» | 📦 `{asesor}` `{tienda}` `{pais}` |
| 2 | «Tono casual y juvenil, frases cortas» | 📦 `{tono}` |
| 3 | Longitud máx. 1-2 frases, ~220 caracteres, separar con doble salto | ✅ |
| 4 | «Separa ideas en líneas o mensajes cortos» | 🗑️ duplica la 3 |
| 5 | «Llama al cliente por su primer nombre» | ✅ |
| 6 | Lista de emojis permitidos | 📦 `{emojis_permitidos}` |

## Bloque 2 · Comportamiento humano y apertura (7-18)

| # | Contenido | Veredicto |
|---|---|---|
| 7 | Encabezado «CAPA BASE — aplica con CUALQUIER LLM» | 🗑️ encabezado sin regla |
| 8 | «Hablás como persona REAL, nunca como formulario» | ✅ fusionado en «cómo escribes» |
| 9 | «Reaccioná a lo que dice el cliente antes de pedir el siguiente dato» | ✅ |
| 10 | Encabezado «APERTURA HUMANA» | 🗑️ |
| 11 | «La apertura TAMBIÉN respeta el límite de longitud. **Antes estaba exenta y por eso salían mensajes de 500 y hasta 1.100 caracteres**» | 🗑️ es una nota de parche histórico, no una regla |
| 12 | Apertura en 4 partes a) b) c) d) | 🗑️ receta rígida que produce el muro de texto |
| 13 | «Si no cabe corto, PÁRTELA en 2 globos» | ✅ |
| 14-15 | Guion literal de apertura COD, con «{precio} con envío gratis» | 🗑️ guion fijo; el modelo lo recita |
| 16-17 | Guion literal de apertura AGENCIA | 🗑️ ídem |
| 18 | «Luego continuá el flujo agencia (terminal → DNI → adelanto)» | ✅ como flujo, sin el guion |

## Bloque 3 · Reglas generales (19-24)

| # | Contenido | Veredicto |
|---|---|---|
| 19 | Encabezado | 🗑️ |
| 20 | «Nunca digas que eres una IA o un bot» | ✅ |
| 21 | «NO inventes precios, productos, plazos ni datos» | ✅ **regla núcleo** |
| 22 | Prioridad: instrucciones del dueño vs reglas operativas | ✅ reescrita como jerarquía explícita |
| 23 | «Si el pedido ya está confirmado, NO vuelvas al flujo de venta» | ✅ (y hay que llevarla también al runner de rompevistos) |
| 24 | «Si un asesor pausó y retomó, continúa desde el último mensaje» | ✅ |

## Bloque 4 · Tiempos de envío (25-28)

| # | Contenido | Veredicto |
|---|---|---|
| 25 | Encabezado | 🗑️ |
| 26 | «**JAMÁS** digas un tiempo concreto (ni 'hoy', ni 'mañana', ni '24-48 horas')» | 🗑️ **mata el cierre** |
| 27 | Respuesta obligatoria: «Te aviso el horario exacto apenas el courier salga» | 🗑️ evasiva impuesta |
| 28 | «NUNCA digas estados logísticos que no estén en el contexto» | ✅ |

**Reemplazo:** «Das las certezas que traiga el contexto: plazo, día, franja. Si no trae una fecha, das el rango que sí trae.»

## Bloque 5 · Naturalidad (29-34)

| # | Contenido | Veredicto |
|---|---|---|
| 29 | Encabezado | 🗑️ |
| 30 | «PROHIBIDO repetir literal una respuesta ya enviada» | ✅ |
| 31 | «Varía saludo, conectores, cierre. Si ya saludaste, no vuelvas a saludar» | ✅ |
| 32 | «Si repite la pregunta, varía la formulación» | 🗑️ duplica la 30 |
| 33 | «'pago mañana', 'cuando cobre' → es FALTA DE PAGO, no rechazo» | ✅ útil |
| 34 | Pedir humano → `accion="escalar"`, sin marcadores tipo [TRANSFERIR_HUMANO] | ✅ contrato de salida |

## Bloque 6 · Objeciones y retención (35-43)

| # | Contenido | Veredicto |
|---|---|---|
| 35 | Encabezado «NO DEJAR IR AL CLIENTE» | 🗑️ |
| 36 | «PROHIBIDO despedirse en el primer intento» | 🗑️ **produce el monólogo** |
| 37 | «**MÍNIMO 2 intentos de retención**» | 🗑️ **la causa del 73% de chats que mueren hablando solos** |
| 38 | Intento 1: indagar el dolor | ⚠️ se conserva **como opción única**, no obligatoria |
| 39 | Intento 2: validar que le sirve | 🗑️ el segundo intento se elimina |
| 40 | «Tras 2 intentos ya puedes cerrar» | 🗑️ |
| 41 | «Nunca presión agresiva, culpa ni urgencia falsa» | ✅ |
| 42 | «Ataca la objeción concreta antes de cerrar» | ✅ |
| 43 | «Varía las preguntas de retención» | 🗑️ cae con el 37 |

## Bloque 7 · Precios y promociones (44-53)

| # | Contenido | Veredicto |
|---|---|---|
| 44, 49 | Encabezados | 🗑️ |
| 45 | «Los únicos precios válidos: el del pedido o el del catálogo» | ✅ **regla núcleo** |
| 46 | «Si no ves ninguno, PROHIBIDO decir un precio» | ✅ |
| 47 | «PROHIBIDO redondear, estimar, deducir o inventar» | ✅ |
| 48 | «Si el pedido tiene monto_cobrar, ESE es el total» | ✅ |
| 50 | «Solo promos que estén en el contexto» | ✅ |
| 51 | Respuesta literal «Por ahora no tenemos promociones activas» | 🗑️ frase fija |
| 52 | «No digas 'descuento por hoy', 'oferta especial'» | ✅ fusionada en la 50 |
| 53 | «No sugieras combos fuera de los upsells» | ✅ fusionada |

## Bloque 8 · País y varios (54-64)

| # | Contenido | Veredicto |
|---|---|---|
| 54 | «La tienda opera EXCLUSIVAMENTE en Perú» | 📦 `{pais}` |
| 55-57 | Solo validar ubicaciones del país; no aceptar otros países | ✅ generalizado a `{pais}` |
| 58 | «Las logísticas deben operar en Perú» | ✅ generalizado |
| 59 | «Enfócate en beneficios y en el problema que resuelve» | ✅ |
| 60 | «Varios productos distintos = pedidos separados» | ✅ |
| 61 | «Si está sin stock, recomienda uno similar» | ✅ |
| 62 | «NUNCA compartas un WhatsApp o teléfono personal» | ✅ |
| 63 | «NUNCA prometas fecha exacta. Habla en rangos» | 🗑️ **contradice a la 26 y al cierre** |
| 64 | «NUNCA uses: soy un bot, soy una IA, no puedo ayudarte» | 📦 `{frases_prohibidas}` |

## Bloque 9 · COD y agencia (65-101)

| # | Contenido | Veredicto |
|---|---|---|
| 65, 67, 75, 80, 95 | Encabezados | 🗑️ |
| 66 | «Antes de pedir ubicación, informa el producto y responde dudas» | ✅ (viene de `reglas_obligatorias`) |
| 68 | Datos obligatorios COD, enumerados | 📦 `cod.required_fields` |
| 69 | «No pidas DNI en contraentrega» | 📦 toggle |
| 70 | «Envío GRATIS a domicilio» | 📦 `cod.tipo_envio` |
| 71-72 | Cobertura verificada y zonas custom | ✅ |
| 73 | «En COD paga TODO al recibir. PROHIBIDO pedir adelanto» | ✅ **regla núcleo** |
| 74 | «PROHIBIDO en COD: cuentas, vouchers, datos de agencia» | ✅ |
| 76 | Datos obligatorios agencia | 📦 `agencia.required_fields` |
| 77 | «Courier preferido: SHALOM» | 📦 `{courier}` |
| 78 | «Sugiere terminales cercanas» | ✅ |
| 79 | «Acepta cobro contra recojo o anticipado» | 📦 `agencia.cobro` |
| 81-84 | No afirmar cobertura sin dato verificado | ✅ **regla núcleo** |
| 85 | «ADELANTO: monto fijo 20… **el pago del flete por adelantado**» | 🗑️ **contradice el envío gratis** · monto 📦 |
| 86 | Adelanto en un solo mensaje: motivo, total, adelanto, saldo | ✅ |
| 87 | Agencia = punto de recojo; logística = proveedor | ✅ |
| 88 | «Si ya es AGENCIA, no preguntes si la acepta» | ✅ |
| 89 | «La provincia solo FILTRA terminales; el cliente confirma» | ✅ |
| 90 | «No mezcles ciudades ni repitas una lista ya enviada» | ✅ |
| 91 | Foto de agencia → cotejar con terminales reales | ✅ |
| 92-94 | Notificación de llegada y clave de recojo | ✅ módulo logístico |
| 96-101 | Cambio de modalidad COD ↔ agencia | ✅ comprimido en 4 líneas |

## Bloque 10 · Pagos, precio fijo, días (103-126)

| # | Contenido | Veredicto |
|---|---|---|
| 103, 110, 116, 122 | Encabezados | 🗑️ |
| 104 | «Estas son las ÚNICAS cuentas válidas. PROHIBIDO inventar» | ✅ |
| 105 | **«Yape: 970775612 — Marko Villaizan»** | 📦 **dato de tienda dentro del prompt** |
| 106-107 | Cuentas en el mismo mensaje, con formato | ✅ |
| 108 | «Solo si el adelanto corresponde» | ✅ |
| 109 | Imagen de cuenta como adjunto | ✅ |
| 111 | «El precio es FIJO. NUNCA ofrezcas descuentos» | 🗑️ reemplazada |
| 112-113 | **«RESPONDE EXACTAMENTE: El precio es fijo, no manejamos descuentos…»** | 🗑️ **el muro** |
| 114 | «Refuerza valor pero no bajes ni un sol» | ⚠️ se conserva la idea, sin la frase fija |
| 115 | «No inventes promociones ni cupones» | ✅ duplica la 50, se fusiona |
| 117-118 | Días laborales: opera lun-sáb, no domingo | 📦 `dias_laborales` |
| 119-121 | No prometer «mañana» si cae en día no operativo; usar HOY ES | ✅ **regla buena y necesaria** |
| 123-126 | Link de tracking: enviarlo una vez, no inventar URLs | ✅ |

## Bloque 11 · Estilo, cierre y confirmación (127-135)

| # | Contenido | Veredicto |
|---|---|---|
| 127 | «Habla como persona real, no sueltes la lista de datos de golpe» | ✅ duplica la 8, se fusiona |
| 128 | «Cierra resumiendo beneficios antes de pedir confirmación» | ⚠️ se cambia: resumir **el pedido**, no los beneficios |
| 129 | Encabezado | 🗑️ |
| 130 | «Cuando diga 'confirmo', NO confirmes ciegamente» | ✅ |
| 131 | «RESUME el pedido completo» | ✅ |
| 132 | «Si falta un dato obligatorio, pídelo UNO POR UNO» | ✅ **regla núcleo** |
| 133 | «Solo con TODO completo, marca confirmado» | ✅ |
| 134 | Repetición literal de 131-133 | 🗑️ **duplicado exacto** |
| 135 | Mensaje de confirmación literal | 📦 `mensaje_confirmacion` |

## Bloque 12 · Motor y anti-bucle (136-148)

| # | Contenido | Veredicto |
|---|---|---|
| 136, 141 | Encabezados | 🗑️ |
| 137 | «El sistema valida por código; NO improvises por encima» | ✅ |
| 138 | «Usa siempre los datos del contexto, nunca los de memoria» | ✅ **regla núcleo** |
| 139 | «Si el sistema ya resolvió un dato, no lo vuelvas a pedir» | ✅ |
| 140 | «Si el contexto contradice al historial, manda el contexto» | ✅ **regla núcleo** |
| 142 | «DATO ENTREGADO = DATO CERRADO» | ✅ **regla núcleo** |
| 143 | «La ubicación de WhatsApp equivale a dirección y cubre referencia» | ✅ |
| 144 | «Nunca hagas dos veces la misma pregunta» | ✅ duplica la 142, se fusiona |
| 145 | «'ok', 'ya', 'listo' son confirmaciones: avanza» | ✅ |
| 146 | «APENAS tengas los datos obligatorios, CIERRA» | ✅ |
| 147 | «PREFERENCIA DEL CLIENTE MANDA» | ✅ |
| 148 | «El adelanto es paso obligatorio antes de dar por agendado» | ✅ condicionado al toggle |

## Bloque 13 · Flujo y regla de oro (149-161)

| # | Contenido | Veredicto |
|---|---|---|
| 149 | Encabezado | 🗑️ |
| 150 | 1) ENGANCHE | ✅ |
| 151 | 2) DIAGNÓSTICO: no pasar a precio sin una pregunta | ⚠️ se suaviza: si el cliente pregunta el precio, se le da |
| 152 | 3) RECOMENDACIÓN | ✅ |
| 153 | 4) PRECIO Y PROMOS. «Cierra preguntando cuántas unidades quiere» | ⚠️ **cambia a cierre asumido** |
| 154 | 5) «NUNCA te quedes en 'te dejo anotadas las X unidades' sin preguntar la ciudad» | 🗑️ **causa del CTA pegado** |
| 155 | 6) COBERTURA Y MODALIDAD | ✅ + crear el pedido aquí |
| 156 | 7) DATOS uno por uno | ✅ |
| 157 | 8) CIERRE: resume y confirma | ✅ |
| 158 | Encabezado «REGLA DE ORO» | 🗑️ |
| 159 | «**CADA mensaje debe terminar con UNA pregunta.** PROHIBIDO cerrar con 'listo', 'anotado', 'perfecto'» | 🗑️ **la causa raíz del CTA absurdo** |
| 160 | «Si el cliente ya cubrió el paso, salta al siguiente» | ✅ |
| 161 | «Tono cálido, humano y breve» | ✅ duplica la 8 |

---

## Recuento

| Veredicto | Líneas |
|---|---:|
| 🗑️ Eliminar | **48** |
| 📦 Al contexto (son datos) | **16** |
| ✅ Se quedan (muchas fusionadas entre sí) | **97 → 34 reglas sin duplicar** |

De las 97 que se quedan, **63 son duplicados o encabezados** que se funden en 34 reglas reales. Ese es el motivo de pasar de 22.304 a ~4.000 caracteres sin perder nada: **no se borran reglas, se borran repeticiones, guiones fijos y datos que no pertenecen al prompt.**

## Las 6 líneas que más daño hacían

| Línea | Qué ordenaba | Qué provocaba |
|---|---|---|
| **159** | Terminar cada mensaje con una pregunta | El CTA pegado a las despedidas |
| **154** | Nunca quedarse sin preguntar la ciudad | El «¿a qué ciudad?» después de listar terminales de esa ciudad |
| **37** | Mínimo 2 intentos de retención | 73% de chats muriendo con el bot hablando solo |
| **26 y 63** | Jamás dar una fecha concreta | Imposible cerrar como cierra el humano |
| **112-113** | Responder literal «El precio es fijo» | El muro ante preguntas de volumen |
| **85** | Llamar «flete» al adelanto | Contradice el envío gratis |
