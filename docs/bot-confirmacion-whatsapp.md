# Bot de confirmación WhatsApp — Comparativa de los 3 informes + plan verificado contra el sistema real

**Caso:** Kito Store · Glucora Berberina · export de 105 chats / 1,080 mensajes (03/09/2026) · campaña Meta CTWA objetivo *interacción*.
**Informes comparados:** Claude, ChatGPT, Gemini.
**Verificación adicional:** lectura directa del proyecto Lovable `rentabilify` (código + base de datos de producción). Nada fue modificado.

> **Estado: PLAN. No se ha ejecutado ningún cambio.**

---

## 1. Veredicto de los 3 informes

| | Claude | ChatGPT | Gemini |
|---|---|---|---|
| Tipo | Forense sobre el export | Arquitectura de funnel | Cualitativo, 3 ejemplos |
| Hallazgos con número verificable | 9 | 4 | 0 |
| Encuentra causas técnicas | Sí | No | No |
| Diseña la medición del CRM | Parcial | **Lo mejor de los tres** | No |
| Errores de precisión | Ninguno relevante | Advierte él mismo que sus fases no son excluyentes | Dice "falla en los 105 chats" 3 veces; falso (ocurre en ~10) |
| Utilidad neta | **70%** | **25%** | **5%** |

**Conclusión:** construir sobre Claude (único que identifica *por qué* se rompe), con la arquitectura de estados y KPIs de ChatGPT (único que diseña *cómo medirlo*). De Gemini se rescata una sola idea válida: condicionar el reenganche a la etiqueta del CRM y pausar la presión comercial cuando el cliente dice que va a consultar a su médico.

### Coincidencias de los tres (verdad triangulada)
1. El bot repregunta datos que el cliente ya dio.
2. Avanza el guion sin resolver lo que el cliente preguntó.
3. Los follow-ups son genéricos y no leen el contexto.
4. Las consultas de salud se responden mal.
5. El cuello de botella está al final del funnel, no al inicio.

### Contradicciones y cuál gana
| Contradicción | Gana | Por qué |
|---|---|---|
| Gemini: el bucle geográfico falla en los 105 chats. Claude: en ~10 | **Claude** | Gemini extrapoló 3 ejemplos a toda la muestra |
| ChatGPT: primero motor de intención + memoria + KB + funnel nuevo. Claude: primero 3 bugs de 10-30 min | **Claude** | No se puede medir un motor de intención mientras el 73% recibe un mensaje roto |
| ChatGPT: el cuello es "intención → decisión". Claude: el cuello es 8→1 (adelanto) | **Claude a corto plazo** | Recuperar los pedidos varados no requiere rediseño |

---

## 2. Lo que verifiqué en el sistema real (esto ninguno de los 3 informes pudo ver)

Consultas de solo lectura sobre la base de producción, tienda `KITO STORE`.

### 2.1 CONFIRMADO — el bug del precio vacío está en los rompevistos, no en el bot
Las secuencias `orden 11` ("1 hora") y `orden 14` ("6 horas") usan `{{precio}}`, variable que no resuelve:

> `Recuerda que {{producto}} está a {{precio}} con envío incluido a todo el Perú 🚚 ¿Avanzamos con tu pedido?`

**91 mensajes enviados con el precio vacío en los últimos 30 días.** Además "envío incluido" es falso: en agencia se cobra adelanto de S/20 (`adelanto_agencia.enabled = true, valor = 20`).
→ Se arregla en el módulo de rompevistos. Los 3 informes se lo atribuían al bot.

### 2.2 NUEVO — hay rompevistos de OTRO producto disparándose a los leads de Glucora
7 de las 18 secuencias activas son de **Verrucure** (producto para verrugas), con `producto_id = NULL` y `cobertura = 'todos'`. Por eso se disparan a cualquier lead:

> *"Quería consultarte si aún te interesa eliminar esa verruga…"*

**10 mensajes de Verrucure enviados a leads de Glucora en 30 días.** Ningún informe lo detectó porque el export de 105 chats no los alcanzó. Es el daño de confianza más caro del sistema.

### 2.3 NUEVO — la carga real de follow-ups es 3x peor de lo reportado
| | Informe Claude | Real (30 días) |
|---|---|---|
| Follow-ups por chat | 3 | **8.9** |
| | | 4,436 envíos / 498 conversaciones |

18 secuencias activas, **todas** con `etapa = '__sin_confirmar__'`, `etiqueta = NULL`, `cobertura = 'todos'`. Cero segmentación.
Hay además duplicados y nombres que no corresponden al delay: dos secuencias a 15 min (`orden 7` y `orden 9`) y una llamada "30 min" que en realidad dispara a las 6 horas (`orden 8`).

### 2.4 NUEVO — la causa real de que el bot nunca pida los datos

```
confirmation_required_fields = ["nombre", "coordenadas", "telefono"]
```

**No pide dirección, ni referencia, ni DNI, ni cantidad.** Claude observó el síntoma (solo 11 de 105 chats vieron al bot pedir datos) y lo atribuyó al prompt. **No es el prompt: es este toggle.** Además `telefono` ya lo tienes de WhatsApp (pedirlo es ruido) y `coordenadas` no aplica a pedidos por agencia.

### 2.5 NUEVO — no existe ningún guardarraíl
```
reglas_prohibidas = NULL
```
El campo está vacío. No hay una sola prohibición configurada: ni de afirmaciones terapéuticas, ni de prometer material que el bot no puede enviar. Por eso el bot le habló de "sensibilidad a la insulina" a un cliente insulinodependiente.

### 2.6 NUEVO — el reintento propio del bot está apagado
`reintento_inactividad.enabled = false` → **el 100% de los seguimientos vienen del módulo de rompevistos.** Confirma tu premisa: el arreglo de cadencia es íntegramente de ese lado.

### 2.7 Contexto de arquitectura
- El prompt (`ai_system_prompt`, 22,304 caracteres) es una **foto congelada**: solo se regenera al pulsar Guardar. Los toggles cambian sin regenerarlo → el prompt se desfasa de la configuración. Ya está diagnosticado en `.lovable/plan/instrucciones-del-bot-alineadas…` y **no se implementó** (no existen las columnas `motor_bot` ni `ai_system_prompt_mayo`).
- `guardas_estrictas = true`, `confianza_minima = 60`, `prompt_personalizado = false`.
- Conversión real 30 días: **12 confirmados / 498 conversaciones = 2.4%**.

### 2.8 La buena noticia
`crm_followup_sequences` **ya tiene** las columnas `etapa`, `etiqueta`, `cobertura`, `producto_id` y `activador`. La segmentación por estado no requiere migración: la capacidad existe y está sin usar.

---

## 3. Lo que ningún informe vio (diagnóstico)

**3.1 El objetivo de campaña está desalineado.** CTWA optimizado por *interacción*: Meta trae gente que escribe, no que compra. Explica parte del 40% que rebotó sin escribir nada propio. Los tres informes asumen que el tráfico es bueno y todo el problema es el bot.

**3.2 No se puede optimizar sobre n=1.** Con 1 conversión en el export (12 en 30 días), "1% → 5%" es ruido. La métrica principal de las próximas semanas debe ser adelantada: `% que llega a datos completos`, `% de pedidos que reciben adelanto`, `TTFR`.

**3.3 Nadie ejecutó el Golden Path.** ChatGPT lo propone y no lo hace. El único cierre fue S/109, Lima, agencia/Shalom: el ticket alto con adelanto, no el barato contraentrega. Son 30 minutos de lectura y valen más que otro informe de IA.

---

## 4. Plan de corrección

Cinco fases. Nada ejecutado. Las fases 1 y 2 no tocan el bot ni el prompt.

### FASE 1 — Rompevistos (sin código, solo configuración) · impacto inmediato

| # | Acción | Evidencia |
|---|---|---|
| 1.1 | Desactivar o asignar `producto_id` a las 7 secuencias de Verrucure | §2.2 — 10 mensajes cruzados |
| 1.2 | Corregir `{{precio}}` en `orden 11` y `orden 14`, o quitar el precio del texto | §2.1 — 91 mensajes rotos |
| 1.3 | Quitar "envío incluido a todo el Perú" (falso con adelanto de S/20) | §2.1 |
| 1.4 | Eliminar duplicados: dejar **una** secuencia a 15 min; renombrar `orden 8` según su delay real | §2.3 |
| 1.5 | Bajar de 18 secuencias a **máximo 4 por estado** | §2.3 — 8.9 por chat |

### FASE 2 — Segmentación por estado (usa columnas que ya existen)

Poblar `etapa` / `etiqueta` en cada secuencia en vez de `__sin_confirmar__` para todas:

| Estado | +25 min | +3 h | +20 h |
|---|---|---|---|
| `esperando_ubicacion` | "¿A qué distrito sería el envío? Así te confirmo si llega hoy o mañana 📍" | — | "Te reservo el pack de 2 a S/109 hasta hoy. ¿Lo mandamos?" |
| `esperando_datos` | "Solo me falta tu nombre y dirección para despacharlo hoy 📦" | "¿Lo dejamos en 1 unidad (S/79) o el pack de 2 (S/109)?" | Última reactivación → `perdido` |
| `esperando_adelanto` | ver Fase 4 | ver Fase 4 | ver Fase 4 |
| `objecion/confianza` | Prueba social concreta (no repetir "es original") | — | — |
| `en_pausa` | **nada** | **nada** | Solo tras `pausa_hasta`, en tono asistencial si el motivo es `consultar_medico` |

**Reglas de supresión — hoy no existe ninguna:**
- No disparar si el cliente escribió en los últimos **20 min**.
- Cliente pidió tiempo ("mañana", "lo converso") → **silencio 12 h**.
- Motivo `consultar_medico` → **silencio 48 h**, reenganche asistencial.
- Nada entre **22:00 y 07:00**.
- Tope de **4 mensajes sin respuesta** → etiquetar `frio` y parar.

### FASE 3 — Configuración del bot (toggles, sin tocar el prompt)

| # | Acción |
|---|---|
| 3.1 | `confirmation_required_fields` → `["nombre", "direccion", "referencia", "distrito", "cantidad"]` + `dni` si es agencia. Quitar `telefono` (ya lo tienes) y `coordenadas` en agencia |
| 3.2 | Llenar `reglas_prohibidas`: sin afirmaciones terapéuticas; sin prometer video/imagen que el bot no puede enviar; sin inventar excusas técnicas |
| 3.3 | Añadir a `reglas_obligatorias`: una sola pregunta por mensaje; nunca repreguntar un dato ya capturado; frase obligatoria de salud |
| 3.4 | Escalar a humano ante mención de **insulina o embarazo** |

**Frase obligatoria ante diabetes / insulina / metformina / embarazo:**
> *"Glucora es un suplemento natural de apoyo, no reemplaza ni modifica tu tratamiento médico. Consúltalo con tu médico antes de empezar 🙌"*

### FASE 4 — Secuencia de recuperación del adelanto (lo más rentable)

Hoy no existe: al crear el pedido el bot se desconecta y el chat cae a la cadencia genérica. 7 de 8 pedidos quedaron en `falta_pago`.

**+2 min tras crear el pedido (lo manda el bot):**
> Listo Teresa, tu pedido **CRM-XXXXX** ya está reservado 📦
> 2 unidades de Glucora — S/109 · Agencia Shalom Ica
> Para despacharlo hoy necesito el adelanto de **S/20**. El resto (S/89) lo pagas al recoger.
> Yape / Plin: **999 999 999** — Kito Store
> Mándame la captura y te paso el código de seguimiento 🙌

**+45 min:** "Tu pedido sale en el despacho de hoy hasta las 4pm. ¿Te ayudo con el Yape?"
**+4 h:** "Si el adelanto te da desconfianza: es solo para reservar el envío a agencia, si no llega se devuelve. ¿Te lo dejo separado para mañana?"
**+24 h:** "¿Lo dejo reservado un día más o lo libero?" → sin respuesta = `perdido_sin_adelanto` + humano.

Instrumentar como embudo propio: `pedido_creado → adelanto_solicitado → captura_recibida → confirmado`.

### FASE 5 — Cierre asumido y memoria de slots (única fase que toca el prompt)

Slots obligatorios antes de crear pedido; **un slot lleno nunca se vuelve a preguntar**:
```
producto (del anuncio) · cantidad · departamento · provincia · distrito
modalidad (se DERIVA de la cobertura, no se pregunta)
nombre_completo · direccion+referencia (cod) | terminal+dni (agencia)
telefono (ya lo tienes)
```

Cambio de cierre — dejar de preguntar la cantidad y asumirla:
```
❌ "¿Cuántas unidades te gustaría pedir?"
✅ "Te dejo separadas las 2 unidades a S/109 (es la más pedida).
    Pásame estos 3 datos y lo despacho hoy:
    1) Nombre completo  2) Dirección exacta + referencia  3) DNI"
```
De los 27 chats que dieron ubicación, 25 nunca eligieron cantidad. El Golden Path confirma anclar en el pack de S/109.

**Advertencia:** el prompt es una foto congelada (§2.7). Tocarlo sin resolver eso hace que los toggles vuelvan a desfasarse. Por eso esta fase va al final.

---

## 5. Orden de ejecución y métricas

| Fase | Dónde se toca | Riesgo | Métrica de control |
|---|---|---|---|
| 1 | Rompevistos (config) | Ninguno | 0 mensajes rotos · 0 mensajes cruzados de producto |
| 2 | Rompevistos (config) | Bajo | Follow-ups por chat: 8.9 → **≤3** |
| 3 | Toggles del bot | Bajo | % de chats donde se piden los datos |
| 4 | Bot + rompevistos | Medio | % de pedidos que reciben adelanto (hoy 12.5%) |
| 5 | Prompt | **Alto** — requiere resolver la foto congelada | % que llega a datos completos |

**Métrica principal de las próximas 4 semanas:** NO confirmados. Usar `% que llega a datos completos` y `% de pedidos con adelanto`. Base actual: 12/498 = 2.4% confirmados.

**En paralelo (fuera del sistema):** correr un conjunto de anuncios optimizado por *mensajes/conversión* contra el actual de *interacción*, y leer el chat de Hugo Milton vs los 7 no confirmados.

---

## 6. Resumen en una línea

El bot no falla por falta de inteligencia conversacional: **falla porque no recuerda, no cierra y no cobra** — y porque encima recibe 8.9 rompevistos por chat, uno de ellos con el precio vacío y otros de un producto distinto. Las dos primeras fases son configuración pura, sin código y sin riesgo, y atacan la mayor parte del daño.
