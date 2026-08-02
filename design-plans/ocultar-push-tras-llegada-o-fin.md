# Ocultar UI de push tras llegada o fin del viaje

Written against: `5436899`

## Evidence chain

- Surface: `/[shareToken]` → `TripViewer` en estado live (`src/components/trip-viewer.tsx`), con `trip.snapshot.status` ∈ `alarming` | `completed` | `cancelled`
- Problem: El `h1` muestra llegada/fin (`copy.arrived` / `copy.completed` / `copy.cancelled`) mientras el bloque push sigue mostrando `copy.notify` / `copy.notifyEnabled` (“avisame cuando llegue”)
- Design evidence: `src/lib/i18n.ts` (strings de estado vs notify); `src/components/trip-viewer.tsx` L208–222 (status) y L335–351 (bloque push sin filtrar por status); `docs/trip-sharing-web-execution-plan.md` (Web Push opt-in sólo para llegada)
- Owner: `src/components/trip-viewer.tsx`
- Scope and affected surfaces: Vista live del viaje compartido; no afecta `StateScreen` ni rutas legales
- Uncertainty: none

## Design decision

No mostrar la UI de opt-in / confirmación / nota iOS de notificaciones de llegada cuando el viaje ya llegó, finalizó o se canceló. Así el copy del CTA deja de contradecir el estado anunciado en el encabezado, y el push queda limitado a la ventana en la que “avisame cuando llegue” tiene sentido (`active` / en camino e `inside_alert_radius`).

## Reuse

- Condición sobre `trip.snapshot.status` (mismo discriminante que el `switch` de `status` en L208–222)
- Copy existente sin cambios: `copy.notify`, `copy.notifyEnabled`, `copy.notifyDenied`, `copy.iosInstall`
- Exemplar: rama de status en `src/components/trip-viewer.tsx` L208–222

No crear primitivos nuevos.

## Changes

1. `src/components/trip-viewer.tsx`
   - Change: Tras resolver `waypoint` (y antes del `return` del viewer live), derivar un booleano, p. ej. `showArrivalPush`, verdadero sólo cuando `trip.snapshot.status` **no** es `alarming`, `completed` ni `cancelled`. Envolver el bloque actual de push (ternario `pushState === "enabled"` … botón …) **y** el párrafo `.ios-note` con `showArrivalPush && …`.
   - Preserve: Suscripción, `pushState`, disabled iOS/subscribing, disclaimer `.notice`, mapa, footer legal, y el bloque push completo en estados en camino / llegando (`inside_alert_radius` y default).
   - Verify: Con status `alarming` | `completed` | `cancelled` no hay botón Bell, ni `.push-success`, ni `.ios-note`. Con status en camino o `inside_alert_radius` el bloque se comporta como hoy.

## Scope

- Inherit: Único consumer del bloque push en esta app (`TripViewer`)
- Verify: Transición en vivo vía broadcast `trip_share_completed` y updates de status a `alarming` / `cancelled` mientras la vista live sigue montada
- Exclude: Cambiar copy i18n; ocultar `.notice`; alterar eyebrow “En vivo”; lógica de `subscribeToArrival` / service worker; estados `preparing` / invalid / expired / revoked

## Validation

- Product: Seguir un viaje compartido; al llegar o terminar, la UI ya no ofrece ni confirma un aviso de llegada futuro
- Interface:
  - `/[shareToken]` live con status default e `inside_alert_radius` → CTA o éxito push visibles según `pushState`
  - Mismos paths con status `alarming`, `completed`, `cancelled` → sin UI push ni nota iOS
  - iPhone Safari no-standalone + status en camino → `.ios-note` sigue; tras `completed` desaparece
- System: Sin nuevas clases ni strings; reutiliza el status del snapshot
- Repository: `npm run typecheck` → OK; `npm run lint` → OK

## Stop conditions

- Stop if el producto debe seguir ofreciendo push tras `alarming` (p. ej. recordatorio distinto) — eso exige nueva copy e intención, fuera de este plan.
- Stop if `trip.snapshot.status` deja de incluir `alarming` | `completed` | `cancelled` como valores de llegada/fin.

## Design documentation

- After acceptance and validation: none (decisión local de presentación; no hay `DESIGN.md` que actualizar)
