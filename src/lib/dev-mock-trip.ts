import type { RedeemedTrip, RoutePoint } from "@/lib/trip-contracts";

const SHARE_ID = "11111111-1111-4111-8111-111111111111";

const ORIGIN = {
  address:
    "Belgrano 1288, B1663 San Miguel, Provincia de Buenos Aires, Argentina",
  latitude: -34.5432,
  longitude: -58.7119,
} as const;

const DESTINATION = {
  index: 0,
  name: "Pichincha",
  address: "Pichincha 2685, Santa Fe, Argentina",
  // Coordenadas cercanas al origen para que el mock de ruta se lea bien en el mapa.
  latitude: -34.5288,
  longitude: -58.7012,
  radiusMeters: 500,
} as const;

/** Longitud del path de simulación (índice máximo = steps - 1). */
export const DEV_ROUTE_STEPS = 24;

/** Puntos interpolados origen → destino para simular avance en el mapa. */
export function buildDevRoutePath(
  steps = DEV_ROUTE_STEPS,
): Omit<RoutePoint, "capturedAt">[] {
  return Array.from({ length: steps }, (_, index) => {
    const t = index / (steps - 1);
    return {
      pointSequence: index,
      latitude: ORIGIN.latitude + (DESTINATION.latitude - ORIGIN.latitude) * t,
      longitude:
        ORIGIN.longitude + (DESTINATION.longitude - ORIGIN.longitude) * t,
      accuracyMeters: 12,
      speedMps: 8,
    };
  });
}

export function createDevMockTrip(now = Date.now()): RedeemedTrip {
  const startedAt = new Date(now - 12 * 60_000).toISOString();
  const capturedAt = new Date(now - 20_000).toISOString();
  const path = buildDevRoutePath();
  const start = path[0];
  if (!start) throw new Error("Dev route path is empty");

  const routePoints: RoutePoint[] = [
    {
      ...start,
      capturedAt,
    },
  ];

  return {
    shareId: SHARE_ID,
    topic: `trip-share:${SHARE_ID}`,
    expiresAt: new Date(now + 6 * 60 * 60_000).toISOString(),
    identity: {
      displayName: "Emir (dev)",
      avatarUrl: null,
    },
    origin: { ...ORIGIN },
    waypoints: [{ ...DESTINATION }],
    snapshot: {
      status: "active",
      currentWaypointIndex: 0,
      serverSequence: 1,
      latestLocation: {
        latitude: start.latitude,
        longitude: start.longitude,
        accuracyMeters: start.accuracyMeters,
        speedMps: start.speedMps,
        capturedAt,
      },
      distanceMeters: 4200,
      etaSeconds: 720,
      startedAt,
      completedAt: null,
    },
    routePoints,
  };
}

export function advanceDevTrip(
  trip: RedeemedTrip,
  route: RoutePoint[],
  pathIndex: number,
  now = Date.now(),
): { trip: RedeemedTrip; route: RoutePoint[]; pathIndex: number } {
  const path = buildDevRoutePath();
  if (pathIndex >= path.length - 1) {
    return { trip, route, pathIndex };
  }
  const nextIndex = pathIndex + 1;
  const point = path[nextIndex];
  if (!point) return { trip, route, pathIndex };

  const capturedAt = new Date(now).toISOString();
  const nextPoint: RoutePoint = { ...point, capturedAt };
  const progress = nextIndex / (path.length - 1);
  const remaining = 1 - progress;
  let status = trip.snapshot.status;
  if (status === "active" || status === "inside_alert_radius") {
    if (progress >= 1) status = "alarming";
    else if (progress >= 0.82) status = "inside_alert_radius";
    else status = "active";
  }

  const nextTrip: RedeemedTrip = {
    ...trip,
    routePoints: [...route, nextPoint],
    snapshot: {
      ...trip.snapshot,
      status,
      serverSequence: trip.snapshot.serverSequence + 1,
      latestLocation: {
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        accuracyMeters: nextPoint.accuracyMeters,
        speedMps: nextPoint.speedMps,
        capturedAt,
      },
      distanceMeters: Math.round(4200 * remaining),
      etaSeconds: Math.max(0, Math.round(720 * remaining)),
      completedAt:
        status === "alarming" || status === "completed"
          ? (trip.snapshot.completedAt ?? capturedAt)
          : null,
    },
  };

  return {
    trip: nextTrip,
    route: [...route, nextPoint],
    pathIndex: nextIndex,
  };
}
