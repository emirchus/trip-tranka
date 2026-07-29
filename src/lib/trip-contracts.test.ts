import { describe, expect, it } from "vitest";
import {
  mergeRoutePoints,
  redeemResponseSchema,
  tripUpdateSchema,
} from "@/lib/trip-contracts";

describe("trip sharing contracts", () => {
  it("parses the initial snapshot and exact route", () => {
    const result = redeemResponseSchema.parse({
      shareId: "7bd1f323-9058-4b3d-952c-989535c42d50",
      topic: "trip-share:7bd1f323-9058-4b3d-952c-989535c42d50",
      expiresAt: "2026-08-01T12:00:00.000Z",
      identity: { displayName: "Emir", avatarUrl: null },
      origin: {
        address: "Plaza Constitución",
        latitude: -34.6275,
        longitude: -58.3817,
      },
      waypoints: [
        {
          index: 0,
          name: "Retiro",
          address: "Retiro, Buenos Aires",
          latitude: -34.5917,
          longitude: -58.3741,
          radiusMeters: 500,
        },
      ],
      snapshot: {
        status: "active",
        currentWaypointIndex: 0,
        serverSequence: 3,
        latestLocation: null,
        distanceMeters: 2400,
        etaSeconds: 600,
        startedAt: "2026-08-01T10:00:00.000Z",
        completedAt: null,
      },
      routePoints: [],
    });
    expect(result.identity.displayName).toBe("Emir");
  });

  it("accepts PostgreSQL ISO timestamps with an explicit UTC offset", () => {
    const result = redeemResponseSchema.parse({
      shareId: "e52c4826-2de6-4c75-80e9-46babf409d78",
      topic: "trip-share:e52c4826-2de6-4c75-80e9-46babf409d78",
      expiresAt: "2026-08-05T07:23:38.710763+00:00",
      identity: {
        displayName: "emir",
        avatarUrl: "https://example.com/avatar.jpg",
      },
      origin: {
        address: "Retiro, Buenos Aires",
        latitude: -34.58993,
        longitude: -58.375999505692,
      },
      waypoints: [
        {
          index: 0,
          name: "CHPW+8Q",
          address: "Ciudad Autónoma de Buenos Aires",
          latitude: -34.564074108267306,
          longitude: -58.40312562652607,
          radiusMeters: 500,
        },
      ],
      snapshot: {
        status: "active",
        currentWaypointIndex: 0,
        serverSequence: 1,
        latestLocation: {
          latitude: -34.58993,
          longitude: -58.375999505692,
          accuracyMeters: 5,
          speedMps: 0,
          capturedAt: "2026-07-29T07:23:34+00:00",
        },
        distanceMeters: 3799.17,
        etaSeconds: null,
        startedAt: "2026-07-29T07:23:35+00:00",
        completedAt: null,
      },
      routePoints: [
        {
          pointSequence: 0,
          latitude: -34.58993,
          longitude: -58.375999505692,
          accuracyMeters: 5,
          speedMps: 0,
          capturedAt: "2026-07-29T07:23:34+00:00",
        },
      ],
    });

    expect(result.snapshot.latestLocation?.capturedAt).toBe(
      "2026-07-29T07:23:34+00:00",
    );
  });

  it("normalizes broadcast point keys", () => {
    const update = tripUpdateSchema.parse({
      schemaVersion: 1,
      shareId: "7bd1f323-9058-4b3d-952c-989535c42d50",
      serverSequence: 4,
      status: "inside_alert_radius",
      currentWaypointIndex: 0,
      points: [
        {
          point_sequence: 8,
          latitude: -34.6,
          longitude: -58.38,
          accuracy_meters: 12,
          speed_mps: 8,
          captured_at: "2026-08-01T10:10:00.000Z",
        },
      ],
      distanceMeters: 420,
      etaSeconds: 50,
      capturedAt: "2026-08-01T10:10:00.000Z",
    });
    expect(update.points[0].pointSequence).toBe(8);
  });

  it("deduplicates and orders route points", () => {
    const base = {
      latitude: -34.6,
      longitude: -58.38,
      capturedAt: "2026-08-01T10:10:00.000Z",
    };
    const merged = mergeRoutePoints(
      [{ ...base, pointSequence: 2 }],
      [
        { ...base, pointSequence: 1 },
        { ...base, pointSequence: 2, latitude: -34.61 },
      ],
    );
    expect(merged.map((point) => point.pointSequence)).toEqual([1, 2]);
    expect(merged[1].latitude).toBe(-34.61);
  });
});
