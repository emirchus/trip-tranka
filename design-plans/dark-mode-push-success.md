# Adaptar `.push-success` al tema oscuro

Written against: `5436899`

## Evidence chain

- Surface: `/[shareToken]` → `TripViewer` live con `pushState === "enabled"` (elemento `.push-success`)
- Problem: En `prefers-color-scheme: dark`, `.push-success` conserva verdes claros (`#1d6327` / `#e8f6e9`) mientras el sibling `.notice` sí tiene pares oscuros
- Design evidence: `src/app/layout.tsx` (`colorScheme: "light dark"`); `src/app/globals.css` L260–268 (layout compartido notice/push-success), L305–308 (colores light de push-success), L454–475 (dark adapta `.notice` y no `.push-success`)
- Owner: `src/app/globals.css`
- Scope and affected surfaces: Banner de éxito push en el viewer live
- Uncertainty: none — los hex dark se eligen por el mismo criterio tonal ya usado en `.notice` (fondo oscuro del matiz + texto más claro)

## Design decision

Completar el bloque `@media (prefers-color-scheme: dark)` con reglas para `.push-success`, espejando el tratamiento de `.notice`: mismo rol de banner semántico, matiz success en lugar de warning/amarillo.

## Reuse

- Bloque dark existente en `src/app/globals.css` L454–480
- Patrón exemplar `.notice` dark: `color: #efe8bd; background: #3b3829;`
- Token `--success: #2e7d32` en `:root` (referencia de matiz; el par dark de notice usa literales, no el token — mantener el mismo estilo de autoría)
- Exemplar: `src/app/globals.css` L472–475

No crear variables nuevas salvo que el executor prefiera `color-mix` sobre literales; no es necesario.

## Changes

1. `src/app/globals.css` — dentro de `@media (prefers-color-scheme: dark)`, después de la regla `.notice` (tras L475):
   - Change: Añadir:

     ```css
     .push-success {
       color: #c8e6c9;
       background: #1e3a24;
     }
     ```

     Criterio: texto verde claro legible sobre fondo verde muy oscuro, análogo a `#efe8bd` / `#3b3829` de `.notice` respecto de sus pares light.
   - Preserve: Colores light de `.push-success` (L305–308); layout compartido con `.notice`; tipografía `0.88rem`; resto del dark block (tokens, journey-grid, map-control, avatar border)
   - Verify: Con dark scheme y banner visible, el fondo no es `#e8f6e9` y el texto no es `#1d6327`; en light no cambia nada

## Scope

- Inherit: Cualquier nodo `.push-success` (hoy solo `TripViewer`)
- Verify: Contraste razonable texto/fondo en dark; convivencia visual con `.notice` y `.viewer-card` oscuros
- Exclude: Dark mode de `.primary-action`, mapa/tiles, `.map-skeleton`, `.avatar-fallback` (plan aparte), cambios en React

## Validation

- Product: Tras habilitar notificaciones en dark mode, el banner de éxito se lee como parte del tema oscuro
- Interface: `/[shareToken]` live + `pushState === "enabled"` en light (sin regresión) y dark (`prefers-color-scheme: dark` o DevTools)
- System: Misma autoría que `.notice` dark; sin clase paralela
- Repository: `npm run lint` → OK (CSS sin impacto en tsc)

## Stop conditions

- Stop if el bloque dark o la clase `.push-success` se eliminan o se migran a otro sistema de tokens antes de ejecutar.
- Stop if se decide abandonar dark mode en el viewer (contradiciría `colorScheme: "light dark"`).

## Design documentation

- After acceptance and validation: none
