# Galaxia de integraciones — para Lovable

Reemplaza la órbita plana del hero por un campo de estrellas 3D con el núcleo de
Rentabilify y las integraciones orbitando en cuatro anillos.

## Archivos

| Archivo | Dónde va |
|---|---|
| `IntegrationGalaxy.tsx` | `src/components/IntegrationGalaxy.tsx` |
| `HeroGalaxy.tsx` | ejemplo de uso — copia el `<IntegrationGalaxy />` a tu hero actual |

Sin dependencias nuevas: Canvas 2D con proyección propia. No usa three.js.

## Lo único que hay que ajustar

Las rutas de los `import` en `HeroGalaxy.tsx` tienen que coincidir con los
nombres reales de `src/assets`. Si un logo no existe todavía, borra ese `import`
y quita el `logo:` de ese nodo: se dibujan las iniciales en el color de marca.

## Props que vale la pena tocar

| Prop | Para qué |
|---|---|
| `band` | alto en px donde deben caber los anillos. Debe coincidir con el alto del div de la banda |
| `coreBottom` | a qué altura queda el núcleo, medido desde abajo |
| `tilt` | más bajo = elipses más planas |
| `spreadW` / `spreadH` | qué tan abiertos quedan los anillos |
| `tileSize` | lado de las baldosas de logo |

Si agregas nodos y el anillo exterior se sale por abajo: baja `tilt`, o sube
`band` junto con el alto del div de la banda.

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin animación, composición estática.
- Pausa el `requestAnimationFrame` cuando sale de pantalla.
- Se puede arrastrar para girar (`interactive={false}` lo desactiva).
- El canvas lleva `role="img"` y un `aria-label` que nombra las integraciones.
