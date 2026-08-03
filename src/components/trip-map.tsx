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
  ZoomControl,
} from "react-leaflet";
import type { RedeemedTrip, RoutePoint } from "@/lib/trip-contracts";

type TripMapProps = {
  trip: RedeemedTrip;
  route: RoutePoint[];
  recenterRequest: number;
  recenterLabel: string;
  onRecenter: () => void;
  layoutTick?: number;
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

function InvalidateSize({ layoutTick = 0 }: { layoutTick?: number }) {
  const map = useMap();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void layoutTick;
      map.invalidateSize();
    });
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [map, layoutTick]);
  return null;
}

export default function TripMap({
  trip,
  route,
  recenterRequest,
  recenterLabel,
  onRecenter,
  layoutTick = 0,
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
    html: '<span class="current-location-pulse" aria-hidden="true"></span><span class="current-location-dot" aria-hidden="true"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  const originLabel =
    trip.origin.address.split(",")[0]?.trim() || trip.origin.address;

  return (
    <div className="map-shell">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="trip-map"
        attributionControl
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <ZoomControl position="bottomright" />
        {polyline.length > 1 && (
          <Polyline
            positions={polyline}
            pathOptions={{
              color: "#1F4E79",
              weight: 5,
              opacity: 0.9,
              dashArray: "10 12",
              lineCap: "round",
            }}
          />
        )}
        <CircleMarker
          center={[trip.origin.latitude, trip.origin.longitude]}
          radius={8}
          pathOptions={{
            color: "#1F4E79",
            weight: 3,
            fillColor: "#ffffff",
            fillOpacity: 1,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {originLabel}
          </Tooltip>
        </CircleMarker>
        {currentWaypoint && (
          <CircleMarker
            center={[currentWaypoint.latitude, currentWaypoint.longitude]}
            radius={8}
            pathOptions={{
              color: "#1F4E79",
              weight: 3,
              fillColor: "#ffffff",
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              {currentWaypoint.name}
            </Tooltip>
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
        <InvalidateSize layoutTick={layoutTick} />
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
