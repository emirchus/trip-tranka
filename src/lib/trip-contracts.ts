import { z } from "zod";

const finiteNumber = z.number().finite();
const isoDateTime = z.iso.datetime({ offset: true });

export const locationSchema = z.object({
  latitude: finiteNumber.min(-90).max(90),
  longitude: finiteNumber.min(-180).max(180),
  accuracyMeters: finiteNumber.nonnegative().nullable().optional(),
  speedMps: finiteNumber.nonnegative().nullable().optional(),
  capturedAt: isoDateTime.nullable().optional(),
});

export const routePointSchema = locationSchema.extend({
  pointSequence: z.number().int().nonnegative(),
});

export const waypointSchema = z.object({
  index: z.number().int().nonnegative(),
  name: z.string().min(1).max(200),
  address: z.string().max(500).nullable().optional(),
  latitude: finiteNumber.min(-90).max(90),
  longitude: finiteNumber.min(-180).max(180),
  radiusMeters: finiteNumber.positive(),
});

export const tripSnapshotSchema = z.object({
  status: z.string(),
  currentWaypointIndex: z.number().int().nonnegative(),
  serverSequence: z.number().int().nonnegative(),
  latestLocation: locationSchema.nullable(),
  distanceMeters: finiteNumber.nonnegative().nullable(),
  etaSeconds: z.number().int().nonnegative().nullable(),
  startedAt: isoDateTime,
  completedAt: isoDateTime.nullable(),
});

export const redeemResponseSchema = z.object({
  shareId: z.uuid(),
  topic: z.string().startsWith("trip-share:"),
  expiresAt: isoDateTime,
  identity: z.object({
    displayName: z.string().min(1).max(120),
    avatarUrl: z.url().nullable(),
  }),
  origin: z.object({
    address: z.string().min(1).max(500),
    latitude: finiteNumber.min(-90).max(90),
    longitude: finiteNumber.min(-180).max(180),
  }),
  waypoints: z.array(waypointSchema).min(1).max(20),
  snapshot: tripSnapshotSchema,
  routePoints: z.array(routePointSchema).max(2000),
});

const broadcastPointSchema = z
  .object({
    point_sequence: z.number().int().nonnegative(),
    latitude: finiteNumber.min(-90).max(90),
    longitude: finiteNumber.min(-180).max(180),
    accuracy_meters: finiteNumber.nonnegative().nullable().optional(),
    speed_mps: finiteNumber.nonnegative().nullable().optional(),
    captured_at: isoDateTime,
  })
  .transform((point) => ({
    pointSequence: point.point_sequence,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracyMeters: point.accuracy_meters,
    speedMps: point.speed_mps,
    capturedAt: point.captured_at,
  }));

export const tripUpdateSchema = z.object({
  schemaVersion: z.literal(1),
  shareId: z.uuid(),
  serverSequence: z.number().int().positive(),
  status: z.string(),
  currentWaypointIndex: z.number().int().nonnegative(),
  points: z.array(broadcastPointSchema).max(25),
  distanceMeters: finiteNumber.nonnegative().nullable(),
  etaSeconds: z.number().int().nonnegative().nullable(),
  capturedAt: isoDateTime,
});

export type RedeemedTrip = z.infer<typeof redeemResponseSchema>;
export type RoutePoint = z.infer<typeof routePointSchema>;
export type TripUpdate = z.infer<typeof tripUpdateSchema>;

export function mergeRoutePoints(
  current: RoutePoint[],
  incoming: RoutePoint[],
): RoutePoint[] {
  const points = new Map(current.map((point) => [point.pointSequence, point]));
  for (const point of incoming) points.set(point.pointSequence, point);
  return dropRouteSpikes(
    [...points.values()].sort(compareRoutePoints).slice(-4000),
  );
}

function compareRoutePoints(a: RoutePoint, b: RoutePoint): number {
  const timeA = capturedAtMs(a);
  const timeB = capturedAtMs(b);
  if (timeA != null && timeB != null && timeA !== timeB) return timeA - timeB;
  return a.pointSequence - b.pointSequence;
}

function capturedAtMs(point: RoutePoint): number | null {
  if (!point.capturedAt) return null;
  const value = Date.parse(point.capturedAt);
  return Number.isFinite(value) ? value : null;
}

function metersBetween(a: RoutePoint, b: RoutePoint): number {
  const earthMeters = 6_371_000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

/**
 * El publisher nativo iOS llegó a intercalarse con la ruta de Flutter.
 * Eso dibuja un zigzag A→B→A. Si C vuelve cerca de A, B era un pico GPS.
 */
export function dropRouteSpikes(
  points: RoutePoint[],
  options?: { minSpikeMeters?: number; returnRatio?: number },
): RoutePoint[] {
  const minSpikeMeters = options?.minSpikeMeters ?? 40;
  const returnRatio = options?.returnRatio ?? 0.35;
  const first = points[0];
  const second = points[1];
  if (points.length < 3 || !first || !second) return points;

  const kept: RoutePoint[] = [first, second];
  for (let index = 2; index < points.length; index += 1) {
    const next = points[index];
    if (!next) continue;
    const previous = kept.at(-1);
    const beforePrevious = kept.at(-2);
    if (previous && beforePrevious) {
      const ab = metersBetween(beforePrevious, previous);
      const bc = metersBetween(previous, next);
      const ac = metersBetween(beforePrevious, next);
      if (
        ab >= minSpikeMeters &&
        bc >= minSpikeMeters &&
        ac < Math.min(ab, bc) * returnRatio
      ) {
        kept.pop();
      }
    }
    kept.push(next);
  }
  return kept;
}
