# Adaptar `.avatar-fallback` al tema oscuro

Written against: `5436899`

## Evidence chain

- Surface: `/[shareToken]` → `TripViewer` live → `Avatar` sin `avatarUrl` (`.avatar.avatar-fallback`)
- Problem: En dark mode el fallback sigue con `#163c5e` / `#dceeff` mientras `.avatar` ya ajusta `border-color: #272d33` y el identity row usa superficies oscuras
- Design evidence: `src/app/layout.tsx` (`colorScheme: "light dark"`); `src/app/globals.css` L137–144 (fallback light), L467–479 (dark: journey/map-control `#272d33`, `.avatar` border; sin regla para `.avatar-fallback`); `src/components/trip-viewer.tsx` L365–377 (`Avatar`)
- Owner: `src/app/globals.css`
- Scope and affected surfaces: Inicial del identity row cuando no hay foto
- Uncertainty: none — reutilizar literales/tokens ya presentes en el bloque dark

## Design decision

En dark mode, pintar `.avatar-fallback` con la superficie oscura ya usada por el chrome del viewer (`#272d33`) y texto `var(--ink)` (ya claro en dark), para alinearlo con `.avatar` / journey-grid sin inventar una paleta nueva.

## Reuse

- Superficie dark existente: `#272d33` (`.journey-grid > div`, `.map-control`, border de `.avatar`)
- Texto: `var(--ink)` (en dark = `#f1f5f8`)
- Exemplar: `src/app/globals.css` L467–479

No crear primitivos nuevos.

## Changes

1. `src/app/globals.css` — dentro de `@media (prefers-color-scheme: dark)`, junto a la regla `.avatar` (tras L478):
   - Change: Añadir:

     ```css
     .avatar-fallback {
       color: var(--ink);
       background: #272d33;
     }
     ```
   - Preserve: Estilos light de `.avatar-fallback`; tamaño, tipografía y `border`/`box-shadow` de `.avatar`; foto remota sin cambios
   - Verify: Sin `avatarUrl` en dark, el círculo no es `#dceeff`; en light permanece `#dceeff` / `#163c5e`

## Scope

- Inherit: `Avatar` en `TripViewer` (único uso actual de `.avatar-fallback`)
- Verify: Identity row con y sin foto en light y dark; borde blanco/dark de `.avatar` sigue coherente
- Exclude: Cambiar markup de `Avatar`; dark de `.push-success` (plan aparte); tiles del mapa; `.brand-mark` de `StateScreen`

## Validation

- Product: Viaje compartido sin avatar remoto se ve integrado en dark mode
- Interface: `/[shareToken]` live con `identity.avatarUrl === null` en light y dark; con URL remota sin regresión
- System: Reutiliza `#272d33` y `--ink`; sin clase nueva
- Repository: `npm run lint` → OK

## Stop conditions

- Stop if `.avatar-fallback` se elimina o el avatar pasa a otro sistema de componentes antes de ejecutar.
- Stop if el dark block deja de usar `#272d33` como superficie de chrome (entonces reutilizar el reemplazo vigente, no reintroducir el literal viejo).

## Design documentation

- After acceptance and validation: none
