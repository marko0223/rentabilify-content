#!/usr/bin/env bash
# Ayudante para el flujo de tema Shopify de Rentabilify.
# Uso: scripts/shopify-theme.sh <comando> [args]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
THEME_DIR="$REPO_ROOT/theme"
TEMPLATES="$THEME_DIR/templates"

die() { echo "error: $*" >&2; exit 1; }

need_store() {
  [ -n "${SHOPIFY_STORE:-}" ] || die "define SHOPIFY_STORE, p.ej. export SHOPIFY_STORE=mi-tienda.myshopify.com"
}

need_theme_dir() {
  [ -d "$TEMPLATES" ] || die "no existe $TEMPLATES — corre primero: $0 pull <ID>"
}

case "${1:-help}" in
  list)
    need_store
    shopify theme list --store "$SHOPIFY_STORE"
    ;;

  pull)
    need_store
    [ $# -ge 2 ] || die "uso: $0 pull <ID-DEL-TEMA>"
    shopify theme pull --store "$SHOPIFY_STORE" --theme "$2" --path "$THEME_DIR"
    ;;

  dev)
    need_store; need_theme_dir
    shopify theme dev --store "$SHOPIFY_STORE" --path "$THEME_DIR"
    ;;

  push)
    need_store; need_theme_dir
    [ $# -ge 2 ] || die "uso: $0 push <ID-DEL-TEMA-BORRADOR>  (nunca el publicado)"
    shopify theme push --store "$SHOPIFY_STORE" --theme "$2" --path "$THEME_DIR"
    ;;

  check)
    need_theme_dir
    shopify theme check --path "$THEME_DIR"
    ;;

  # Clona la plantilla de una página para que la nueva se vea igual que la modelo.
  # scripts/shopify-theme.sh clone-page servicios nueva
  clone-page)
    need_theme_dir
    [ $# -ge 3 ] || die "uso: $0 clone-page <handle-modelo> <handle-nuevo>"
    src="" ; for ext in json liquid; do
      [ -f "$TEMPLATES/page.$2.$ext" ] && src="$TEMPLATES/page.$2.$ext" && break
    done
    [ -n "$src" ] || die "no encontré templates/page.$2.json ni .liquid"
    dst="$TEMPLATES/page.$3.${src##*.}"
    [ -e "$dst" ] && die "$dst ya existe; bórralo o usa otro handle"
    cp "$src" "$dst"
    echo "creada: ${dst#$REPO_ROOT/}"
    echo
    echo "Siguientes pasos:"
    echo "  1. Edita solo los textos e imágenes dentro de 'settings' en ese archivo."
    echo "  2. Sube el tema:  $0 push <ID-BORRADOR>"
    echo "  3. En el admin: Páginas → tu página → Plantilla de tema → page.$3"
    ;;

  help|*)
    sed -n '2,4p' "${BASH_SOURCE[0]}"
    cat <<'USAGE'

Comandos:
  list                        Lista los temas de la tienda con sus IDs
  pull <id>                   Baja el tema a ./theme
  dev                         Vista previa en vivo (no toca el tema publicado)
  push <id>                   Sube ./theme a un tema borrador
  check                       Valida el tema (theme check)
  clone-page <modelo> <nuevo> Copia la plantilla de una página a otra

Variables:
  SHOPIFY_STORE   mi-tienda.myshopify.com   (obligatoria para list/pull/dev/push)
USAGE
    ;;
esac
