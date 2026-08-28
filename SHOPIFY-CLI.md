# Editar el tema de Shopify con el CLI

Guía del flujo de trabajo entre **tu máquina** (que sí puede hablar con Shopify)
y **este repo** (donde Claude edita los archivos del tema).

---

## Por qué hace falta este ida y vuelta

La sesión remota de Claude tiene la salida a Shopify bloqueada por política de red
(`admin.shopify.com`, `*.myshopify.com`, `shopify.dev` → 403 en el proxy).
Claude puede **editar Liquid, JSON y CSS**, pero no puede hacer `pull` ni `push`
contra la tienda. Esos dos pasos los corres tú.

```
[tu tienda] --pull--> [tu PC] --git push--> [repo] --Claude edita--> [repo] --git pull--> [tu PC] --push--> [tu tienda]
```

---

## 1. Instalar el CLI (una sola vez, en tu máquina)

```bash
npm install -g @shopify/cli@latest
shopify version
```

## 2. Bajar el tema a tu PC

```bash
cd ruta/a/rentabilify-content
shopify theme list --store TU-TIENDA.myshopify.com   # anota el ID del tema
shopify theme pull --store TU-TIENDA.myshopify.com --theme <ID> --path theme
```

La primera vez se abre el navegador para autenticarte. Después:

```bash
git add theme && git commit -m "Baja tema desde Shopify" && git push
```

## 3. Claude edita en el repo

Le dices qué cambiar. Claude trabaja sobre `theme/` y hace push a la rama.

## 4. Subir los cambios a la tienda

```bash
git pull
# Primero probar en vivo sin tocar el tema publicado:
shopify theme dev --store TU-TIENDA.myshopify.com --path theme

# Cuando estés conforme, subir a un tema NO publicado:
shopify theme push --store TU-TIENDA.myshopify.com --theme <ID-BORRADOR> --path theme
```

> **Regla de oro:** nunca hagas `push` directo al tema publicado. Duplica primero:
> `shopify theme duplicate --store TU-TIENDA.myshopify.com --theme <ID-VIVO>`

---

## Cómo hacer que una página nueva se vea igual que otra

En Shopify el "diseño" de una página vive en una **plantilla JSON**, no en la página.
Para clonar el aspecto de una página existente:

### Opción A — desde el admin (sin código, 2 minutos)

1. **Tienda online → Temas → ⋯ → Editar código**
2. Busca en `templates/` la plantilla de la página modelo, por ejemplo
   `page.servicios.json`.
3. **Add a new template → page →** nómbrala `nueva` → se crea `templates/page.nueva.json`.
4. Copia el contenido completo de `page.servicios.json` dentro de `page.nueva.json`.
5. **Tienda online → Páginas → Agregar página**; en *Plantilla de tema* (abajo a la
   derecha) elige `page.nueva`.
6. Edita los textos en el **personalizador**, no en el código.

### Opción B — con el CLI y este repo

```bash
cp theme/templates/page.servicios.json theme/templates/page.nueva.json
```

Luego cambia dentro del JSON solo los textos/imágenes de cada `settings`, dejando
intactos `type`, `blocks` y `order` — eso es lo que preserva el diseño idéntico.

Ejecuta `scripts/shopify-theme.sh clone-page servicios nueva` para hacer la copia.

### Qué NO tocar si quieres que se vea idéntica

- `sections/*.liquid` → son compartidos; si los editas cambias **todas** las páginas.
- `config/settings_data.json` → colores y tipografías globales del tema.
- Los `"type"` dentro del JSON → definen qué sección se renderiza.

---

## Comprobar antes de subir

```bash
shopify theme check --path theme
```
