"use client";

import {
  Bell,
  CheckCircle2,
  Clock3,
  MapPin,
  MapPinned,
  Route,
  Send,
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import {
  advanceDevTrip,
  createDevMockTrip,
  DEV_ROUTE_STEPS,
} from "@/lib/dev-mock-trip";
import { copyFor, type TrankaLocale } from "@/lib/i18n";

const TripMap = dynamic(() => import("@/components/trip-map"), {
  ssr: false,
  loading: () => <div className="map-skeleton" aria-hidden="true" />,
});

type TripStatus =
  | "active"
  | "inside_alert_radius"
  | "alarming"
  | "completed"
  | "cancelled";

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "active", label: "En camino" },
  { value: "inside_alert_radius", label: "Llegando" },
  { value: "alarming", label: "Llegó" },
  { value: "completed", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

function createInitialDevState() {
  const trip = createDevMockTrip();
  return { trip, route: trip.routePoints, pathIndex: 0 };
}

export function DevTripViewer({ locale }: { locale: TrankaLocale }) {
  const copy = copyFor(locale);
  const [sim, setSim] = useState(createInitialDevState);
  const [playing, setPlaying] = useState(true);
  const [connectionLive, setConnectionLive] = useState(true);
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [pushState, setPushState] = useState<"idle" | "enabled">("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { trip, route } = sim;

  const lastPathIndex = DEV_ROUTE_STEPS - 1;

  const onTick = useEffectEvent(() => {
    setSim((current) => {
      if (current.pathIndex >= lastPathIndex) return current;
      return advanceDevTrip(current.trip, current.route, current.pathIndex);
    });
  });

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => onTick(), 2000);
    return () => window.clearInterval(timer);
  }, [playing, onTick]);

  if (playing && sim.pathIndex >= lastPathIndex) {
    setPlaying(false);
  }

  const waypoint =
    trip.waypoints[trip.snapshot.currentWaypointIndex] ?? trip.waypoints.at(-1);
  if (!waypoint) return null;

  let statusLabel = copy.onTheWay(trip.identity.displayName);
  switch (trip.snapshot.status) {
    case "inside_alert_radius":
      statusLabel = copy.arriving(trip.identity.displayName);
      break;
    case "alarming":
      statusLabel = copy.arrived(
        trip.identity.displayName,
        waypoint.name ?? copy.destination,
      );
      break;
    case "completed":
      statusLabel = copy.completed;
      break;
    case "cancelled":
      statusLabel = copy.cancelled;
      break;
  }

  const showArrivalPush = !["alarming", "completed", "cancelled"].includes(
    trip.snapshot.status,
  );
  const tripActive = ["active", "inside_alert_radius"].includes(
    trip.snapshot.status,
  );
  const etaMinutes =
    trip.snapshot.etaSeconds != null
      ? Math.max(1, Math.round(trip.snapshot.etaSeconds / 60))
      : null;
  const departureLabel = formatClock(trip.snapshot.startedAt, locale);
  const etaClockLabel = formatClock(
    trip.snapshot.etaSeconds != null
      ? new Date(Date.now() + trip.snapshot.etaSeconds * 1000).toISOString()
      : null,
    locale,
  );
  const originLabel =
    trip.origin.address.split(",")[0]?.trim() || trip.origin.address;

  const setStatus = (status: TripStatus) => {
    const now = new Date().toISOString();
    setSim((current) => ({
      ...current,
      trip: {
        ...current.trip,
        snapshot: {
          ...current.trip.snapshot,
          status,
          completedAt:
            status === "completed" || status === "alarming" ? now : null,
        },
      },
    }));
  };

  const reset = () => {
    setSim(createInitialDevState());
    setPlaying(true);
    setPushState("idle");
    setConnectionLive(true);
  };

  return (
    <main className="viewer-shell">
      <section
        className={`viewer-layout${sheetOpen ? " is-sheet-open" : ""}`}
        aria-live="polite"
      >
        <div className="dev-toolbar">
          <p className="eyebrow">Dev · /dev/trip</p>
          <div className="dev-toolbar-actions">
            <button type="button" onClick={() => setPlaying((value) => !value)}>
              {playing ? "Pausar ruta" : "Seguir ruta"}
            </button>
            <button type="button" onClick={reset}>
              Reiniciar
            </button>
            <button
              type="button"
              onClick={() => setConnectionLive((value) => !value)}
            >
              {connectionLive ? "Simular reconexión" : "Volver en vivo"}
            </button>
          </div>
          <div className="dev-toolbar-actions">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  trip.snapshot.status === option.value
                    ? "is-active"
                    : undefined
                }
                onClick={() => setStatus(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="viewer-map-column">
          <div className="map-panel">
            <div className="map-heading">
              <span>
                <MapPinned aria-hidden="true" size={18} />
                {copy.mapTitle}
              </span>
              <span className={`live-pill ${connectionLive ? "" : "muted"}`}>
                <span className="live-dot" aria-hidden="true" />
                {connectionLive ? copy.live : copy.reconnecting}
              </span>
            </div>
            <TripMap
              trip={trip}
              route={route}
              recenterRequest={recenterRequest}
              recenterLabel={copy.recenter}
              onRecenter={() => setRecenterRequest((value) => value + 1)}
            />
          </div>
        </div>

        {sheetOpen && (
          <button
            type="button"
            className="sheet-scrim"
            aria-label={copy.sheetCollapse}
            onClick={() => setSheetOpen(false)}
          />
        )}

        <aside className={`viewer-sheet${sheetOpen ? " is-open" : " is-peek"}`}>
          <button
            type="button"
            className="sheet-handle-hit viewer-mobile-only"
            aria-label={sheetOpen ? copy.sheetCollapse : copy.sheetExpand}
            onClick={() => setSheetOpen((value) => !value)}
          >
            <span className="sheet-handle" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="sheet-summary viewer-mobile-only"
            onClick={() => setSheetOpen(true)}
          >
            <div className="avatar avatar-fallback" aria-hidden="true">
              {trip.identity.displayName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="sheet-summary-copy">
              <p className="eyebrow">
                <span
                  className={`live-dot ${connectionLive ? "" : "muted"}`}
                  aria-hidden="true"
                />
                {connectionLive ? copy.live : copy.reconnecting}
              </p>
              <strong>{statusLabel}</strong>
              <span>
                {etaMinutes != null
                  ? copy.arrivingIn(etaMinutes)
                  : `${copy.lastUpdate}: ${copy.now}`}
              </span>
            </div>
          </button>

          <div className="sheet-body">
            <div className="progress-card">
              <div className="progress-card-head">
                <h2>{copy.tripInProgress}</h2>
                <span
                  className={`status-pill ${tripActive ? "is-active" : "is-done"}`}
                >
                  <span className="status-pill-dot" aria-hidden="true" />
                  {tripActive ? copy.activeStatus : statusLabel}
                </span>
              </div>
              <ol className="trip-timeline">
                <li className="timeline-step is-done">
                  <span className="timeline-icon" aria-hidden="true">
                    <Send size={14} strokeWidth={2.25} />
                  </span>
                  <div>
                    <small>{copy.departureDone}</small>
                    <strong>{originLabel}</strong>
                    <span>{departureLabel}</span>
                  </div>
                </li>
                <li
                  className={`timeline-step ${tripActive ? "is-current" : "is-done"}`}
                >
                  <span className="timeline-icon" aria-hidden="true">
                    <Route size={14} strokeWidth={2.25} />
                  </span>
                  <div>
                    <small>
                      {trip.snapshot.status === "inside_alert_radius"
                        ? copy.nextStop
                        : copy.enRoute}
                    </small>
                    <strong>{statusLabel}</strong>
                    <span className="timeline-accent">
                      {etaMinutes != null
                        ? copy.arrivingIn(etaMinutes)
                        : copy.now}
                    </span>
                  </div>
                </li>
                <li
                  className={`timeline-step ${tripActive ? "is-upcoming" : "is-done"}`}
                >
                  <span className="timeline-icon" aria-hidden="true">
                    <MapPin size={14} strokeWidth={2.25} />
                  </span>
                  <div>
                    <small>{copy.destination}</small>
                    <strong>
                      {(waypoint.address ?? waypoint.name)
                        .split(",")[0]
                        ?.trim() || waypoint.name}
                    </strong>
                    <span>{copy.etaAt(etaClockLabel)}</span>
                  </div>
                </li>
              </ol>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <Clock3 aria-hidden="true" size={18} />
                <small>{copy.remainingTime}</small>
                <strong>
                  {etaMinutes != null ? copy.minutesShort(etaMinutes) : "—"}
                </strong>
              </div>
              <div className="stat-card">
                <Route aria-hidden="true" size={18} />
                <small>{copy.distance}</small>
                <strong>{formatDistance(trip.snapshot.distanceMeters)}</strong>
              </div>
            </div>

            <div className="shared-card">
              <div className="avatar avatar-fallback" aria-hidden="true">
                {trip.identity.displayName.trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <small>{copy.sharedBy}</small>
                <strong>{trip.identity.displayName}</strong>
              </div>
              <ShieldCheck
                className="shared-shield"
                aria-hidden="true"
                size={20}
              />
            </div>

            <div className="notice">
              <ShieldCheck aria-hidden="true" size={18} />
              <p>{copy.liveDisclaimer}</p>
            </div>

            {showArrivalPush &&
              (pushState === "enabled" ? (
                <p className="push-success">
                  <Bell aria-hidden="true" size={18} />
                  <span>{copy.notifyEnabled}</span>
                  <CheckCircle2
                    className="push-check"
                    aria-hidden="true"
                    size={20}
                  />
                </p>
              ) : (
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => setPushState("enabled")}
                >
                  <Bell aria-hidden="true" size={20} />
                  {copy.notify}
                </button>
              ))}

            <footer className="viewer-footer">
              <span className="brand-lockup">
                <span className="brand-lockup-mark" aria-hidden="true">
                  T
                </span>
                tranka
              </span>
              <div className="legal-links">
                <Link href="/privacidad">{copy.privacy}</Link>
                <span aria-hidden="true">·</span>
                <Link href="/terminos">{copy.terms}</Link>
              </div>
            </footer>
          </div>
        </aside>
      </section>
    </main>
  );
}

function formatClock(value: string | null | undefined, locale: TrankaLocale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDistance(meters: number | null | undefined) {
  if (meters == null || Number.isNaN(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
