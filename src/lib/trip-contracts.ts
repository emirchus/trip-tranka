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
  return [...points.values()]
    .sort((a, b) => a.pointSequence - b.pointSequence)
    .slice(-4000);
}
