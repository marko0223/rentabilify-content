# El pedido no se crea al detectar la ciudad — y eso explica casi todo lo demás

**Verificado en el export de 161 chats (03/09/2026 15:32).**

## El dato

| | |
|---|---:|
| Chats donde el cliente dio ciudad o distrito | **30** |
| Con pedido creado | 11 |
| **Sin pedido creado** | **19 (63%)** |
| De esos, casos de Lima con distrito concreto | **12** |

Distritos que el cliente dio y no generaron pedido: Independencia, Lurín, Villa María del Triunfo, Comas, Los Olivos, San Juan de Lurigancho, Ate/Huaycán, La Perla (Callao), Breña, Vitarte, Chorrillos.

## El caso que lo resume todo (chat 16)

> **Cliente:** Lurin Pachacamac Av Manuel del Valle
> **Cliente:** Fácil de llegar
> **Bot:** Genial! **Anoté tu dirección** en Av Manuel del Valle. Dame un segundito que te confirmo el precio exacto de **la crema** y la cobertura para tu zona 🙌. **¿A qué ciudad y distrito sería el envío?**

Tres fallos en un solo mensaje:

1. Dice que anotó la dirección — **pero no la escribe en ningún pedido**. Es teatro conversacional.
2. Habla de **«la crema»**: producto equivocado, este chat es de Glucora.
3. Vuelve a pedir la ciudad que acaba de repetir.

Y con distrito + calle + referencia ya en la mano, **no creó el pedido**.

Otro (chat 139):

> **Cliente:** Yo vivo en Chorrillos. Av. Guardia Peruana
> **Bot:** Ya dejé anotada tu zona en Chorrillos… ¡Que tengas una linda semana! 🙌 **¿A qué ciudad y distrito sería el envío?**

## Por qué esto es la causa raíz, no un síntoma más

El flujo de este sistema es: **detectar ciudad → crear pedido → el pedido dice qué campos faltan → el bot pide esos campos**.

Si el pedido no se crea, **no hay lista de campos faltantes**, y entonces el bot no tiene nada que lo empuje a pedir datos. Por eso:

- Solo **3 de 15** pedidos recibieron una petición de nombre o DNI.
- Las peticiones de datos son el **0,0%** de los mensajes posteriores al despliegue.
- El bot rellena el vacío con charla: promos, beneficios y rompevistos.

No es que el bot «se olvide» de pedir los datos. Es que **nunca arranca el proceso que se los pediría**.

Aplica igual a contraentrega y a agencia.

## Patrón relacionado: promesas que nunca se cumplen

El bot dice que va a volver con información y no vuelve. Tres variantes del mismo defecto:

| Chat | Promesa | Resultado |
|---|---|---|
| 84 | «Dame un segundito, consulto la dosis exacta con mi equipo» | Nunca la dio |
| 109 (export anterior) | «Déjame consultar el dato exacto del registro sanitario» | Nunca lo dio |
| 71 | «El sistema debe estar lento, te envío el video nuevamente» | Nunca lo envió |

El bot no debería poder prometer nada que no pueda entregar en ese mismo mensaje.

## Qué pedir

**Crear el pedido en cuanto la cobertura resuelva una ubicación válida**, con lo que se tenga, y dejar que el propio pedido dicte qué falta. Ese es el motor de recolección de datos que hoy está apagado.

Y una regla de honestidad: si el bot dice «anoté tu dirección», esa dirección tiene que haberse escrito en el pedido. Si no se escribió, no puede decirlo.
