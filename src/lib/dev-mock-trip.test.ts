import { describe, expect, it } from "vitest";
import {
  advanceDevTrip,
  createDevMockTrip,
  DEV_ROUTE_STEPS,
} from "@/lib/dev-mock-trip";
import { redeemResponseSchema } from "@/lib/trip-contracts";

describe("dev mock trip", () => {
  it("creates a snapshot that matches the redeem contract", () => {
    const trip = createDevMockTrip(Date.parse("2026-08-02T04:00:00.000Z"));
    expect(redeemResponseSchema.parse(trip).identity.displayName).toBe(
      "Emir (dev)",
    );
  });

  it("advances along the path and stops at the end", () => {
    let trip = createDevMockTrip();
    let route = trip.routePoints;
    let pathIndex = 0;

    for (let step = 0; step < DEV_ROUTE_STEPS + 5; step += 1) {
      const next = advanceDevTrip(trip, route, pathIndex);
      trip = next.trip;
      route = next.route;
      pathIndex = next.pathIndex;
    }

    expect(pathIndex).toBe(DEV_ROUTE_STEPS - 1);
    expect(trip.snapshot.status).toBe("alarming");
    expect(route.length).toBe(DEV_ROUTE_STEPS);
  });
});
