"use client";

import { divIcon } from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { RedeemedTrip, RoutePoint } from "@/lib/trip-contracts";

type TripMapProps = {
  trip: RedeemedTrip;
  route: RoutePoint[];
  recenterRequest: number;
  recenterLabel: string;
  onRecenter: () => void;
};

function Recenter({
  location,
  request,
}: {
  location: [number, number];
  request: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (request > 0) map.flyTo(location, Math.max(map.getZoom(), 15));
  }, [location, map, request]);
  return null;
}

export default function TripMap({
  trip,
  route,
  recenterRequest,
  recenterLabel,
  onRecenter,
}: TripMapProps) {
  const latest = trip.snapshot.latestLocation;
  const currentWaypoint =
    trip.waypoints[trip.snapshot.currentWaypointIndex] ?? trip.waypoints.at(-1);
  const center: [number, number] = latest
    ? [latest.latitude, latest.longitude]
    : [trip.origin.latitude, trip.origin.longitude];
  const polyline: [number, number][] = route.map((point) => [
    point.latitude,
    point.longitude,
  ]);
  const currentLocationIcon = divIcon({
    className: "current-location-marker",
    html: '<span aria-hidden="true"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="map-shell">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="trip-map"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {polyline.length > 1 && (
          <Polyline
            positions={polyline}
            pathOptions={{ color: "#347FC4", weight: 5, opacity: 0.82 }}
          />
        )}
        <CircleMarker
          center={[trip.origin.latitude, trip.origin.longitude]}
          radius={7}
          pathOptions={{
            color: "#1F2328",
            fillColor: "#F6D86B",
            fillOpacity: 1,
          }}
        >
          <Tooltip>{trip.origin.address}</Tooltip>
        </CircleMarker>
        {currentWaypoint && (
          <CircleMarker
            center={[currentWaypoint.latitude, currentWaypoint.longitude]}
            radius={9}
            pathOptions={{
              color: "#1F2328",
              fillColor: "#E89A4A",
              fillOpacity: 1,
            }}
          >
            <Tooltip>{currentWaypoint.name}</Tooltip>
          </CircleMarker>
        )}
        {latest && (
          <Marker
            position={[latest.latitude, latest.longitude]}
            icon={currentLocationIcon}
          >
            <Tooltip>{trip.identity.displayName}</Tooltip>
          </Marker>
        )}
        <Recenter location={center} request={recenterRequest} />
      </MapContainer>
      <button
        type="button"
        className="map-control"
        onClick={onRecenter}
        aria-label={recenterLabel}
        title={recenterLabel}
      >
        <LocateFixed aria-hidden="true" size={20} />
      </button>
    </div>
  );
}
