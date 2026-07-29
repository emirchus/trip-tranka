# Viajes compartidos: ejecución web

Estado: PWA MVP implementada en Next.js 16 App Router y preparada para Vercel.

## Responsabilidad de este proyecto

`trip-tranka` canjea un token bearer en el navegador, crea o reutiliza una
sesión anónima, presenta el snapshot inicial y escucha exclusivamente Supabase
Realtime Broadcast privado. No existe polling periódico y el token nunca se
procesa en Server Components.

## Entregables implementados

- Ruta dinámica `/[shareToken]`, landing `/`, `/privacidad` y `/terminos`.
- Metadata genérica, `noindex`, `no-store` y `Referrer-Policy: no-referrer`.
- CSP para Supabase HTTPS/WSS, CARTO, avatars y Turnstile.
- Contratos Zod para snapshot, ruta y eventos Realtime.
- Sesión anónima con Turnstile y canje mediante `redeem-trip-share`.
- Canal privado `trip-share:{shareId}` autenticado.
- Deduplicación por `serverSequence`, recuperación del snapshot ante saltos y
  cierre al revocar, vencer o completar.
- Estados en vivo, reconexión, llegada, cancelación y enlace no disponible con
  copy no enumerable.
- Mapa CARTO/Leaflet con origen, ubicación, waypoint actual, polyline exacta y
  control de recentrado.
- PWA con manifest, íconos Tranka y Service Worker sin caché.
- Web Push opt-in sólo para llegada; relación `shareId → URL` en IndexedDB.
- Payload Push sin token ni coordenadas.
- Locale por cookie/`Accept-Language`: `es-AR`, `es`, `en`, `pt-BR`, fallback
  `es-AR`.
- Pruebas unitarias de contratos, secuencias y locales; Playwright móvil para
  enlace inválido; build de producción.

## Variables Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

No se debe exponer service role, secretos Turnstile, VAPID privado ni secretos
de cron en Vercel.

## Checklist de staging

1. Crear proyecto Vercel y asociar el dominio temporal.
2. Cargar las cuatro variables públicas.
3. Autorizar el dominio staging en Supabase Auth y Turnstile.
4. Autorizar el origen en `TRIP_SHARE_ALLOWED_ORIGINS`.
5. Crear un share desde una build Flutter con el flag habilitado.
6. Verificar snapshot, ruta previa, ruta creciente y reconexión sin polling.
7. Verificar aislamiento entre dos topics con espectadores distintos.
8. Probar revocación, finalización y vencimiento.
9. Probar Web Push real en Chrome, Firefox, Safari macOS y Safari iOS instalada.
10. Confirmar que logs, analytics, metadata y errores no contienen tokens ni
    coordenadas.

## Publicación

Después de staging, asignar `trip.tranka.app`, repetir el recorrido end-to-end
y recién entonces habilitar el flag móvil. El rollback web es una reversión de
Vercel; el rollback móvil consiste en volver a compilar con el flag apagado.
Los shares existentes pueden revocarse y purgarse desde Supabase.
