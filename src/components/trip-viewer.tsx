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
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TripBottomSheet } from "@/components/trip-bottom-sheet";
import { copyFor, type TrankaLocale } from "@/lib/i18n";
import { saveShareUrl, subscribeToArrival } from "@/lib/push";
import { redeemTrip } from "@/lib/redeem-trip";
import { supabaseBrowser } from "@/lib/supabase";
import {
  mergeRoutePoints,
  type RedeemedTrip,
  type RoutePoint,
  tripUpdateSchema,
} from "@/lib/trip-contracts";

const TripMap = dynamic(() => import("@/components/trip-map"), {
  ssr: false,
  loading: () => <div className="map-skeleton" aria-hidden="true" />,
});

type ConnectionState =
  | "preparing"
  | "live"
  | "reconnecting"
  | "invalid"
  | "revoked"
  | "expired";

const tokenPattern = /^[A-Za-z0-9_-]{24,128}$/;

export function TripViewer({ locale }: { locale: TrankaLocale }) {
  const copy = copyFor(locale);
  const [trip, setTrip] = useState<RedeemedTrip | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("preparing");
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [clockTick, setClockTick] = useState(0);
  const [pushState, setPushState] = useState<
    "idle" | "subscribing" | "enabled" | "denied"
  >("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const sequence = useRef(0);
  const token = useRef("");

  const refreshSnapshot = useCallback(async () => {
    const next = await redeemTrip(token.current);
    console.log("next", next);
    sequence.current = next.snapshot.serverSequence;
    setTrip(next);
    setRoute(next.routePoints);
    await saveShareUrl(next.shareId, window.location.href);
    return next;
  }, []);

  useEffect(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: cookie keeps the selected locale for server-rendered legal pages
    document.cookie = `tranka_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    const segment = window.location.pathname.split("/").filter(Boolean)[0];
    let decoded = "";
    try {
      decoded = decodeURIComponent(segment ?? "");
    } catch {
      setConnection("invalid");
      return;
    }
    console.log("decoded", decoded);
    if (!tokenPattern.test(decoded)) {
      setConnection("invalid");
      return;
    }
    console.log("tokenPattern", tokenPattern.test(decoded));
    token.current = decoded;

    let disposed = false;
    let terminal = false;
    let channel: ReturnType<ReturnType<typeof supabaseBrowser>["channel"]>;
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      try {
        const initial = await refreshSnapshot();
        console.log("initial", initial);
        if (disposed) return;
        const milliseconds = Math.max(
          0,
          Date.parse(initial.expiresAt) - Date.now(),
        );
        expiryTimer = setTimeout(() => {
          setConnection("expired");
          if (channel) void supabaseBrowser().removeChannel(channel);
        }, milliseconds);

        const supabase = supabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("session", session);

        if (!session) throw new Error("Trip unavailable");

        await supabase.realtime.setAuth(session.access_token);

        channel = supabase.channel(initial.topic, {
          config: { private: true, broadcast: { self: false } },
        });
        channel
          .on("broadcast", { event: "trip_share_updated" }, ({ payload }) => {
            const parsed = tripUpdateSchema.safeParse(payload);
            if (!parsed.success || disposed) return;
            const update = parsed.data;
            if (update.serverSequence <= sequence.current) return;
            if (update.serverSequence > sequence.current + 1) {
              setConnection("reconnecting");
              void refreshSnapshot()
                .then(() => setConnection("live"))
                .catch(() => setConnection("invalid"));
              return;
            }
            sequence.current = update.serverSequence;
            setRoute((current) => mergeRoutePoints(current, update.points));
            setTrip((current) => {
              if (!current) return current;
              const newest = update.points.at(-1);
              return {
                ...current,
                snapshot: {
                  ...current.snapshot,
                  status: update.status,
                  currentWaypointIndex: update.currentWaypointIndex,
                  serverSequence: update.serverSequence,
                  distanceMeters: update.distanceMeters,
                  etaSeconds: update.etaSeconds,
                  latestLocation: newest
                    ? {
                        latitude: newest.latitude,
                        longitude: newest.longitude,
                        accuracyMeters: newest.accuracyMeters,
                        speedMps: newest.speedMps,
                        capturedAt: newest.capturedAt,
                      }
                    : current.snapshot.latestLocation,
                },
              };
            });
            setConnection("live");
          })
          .on("broadcast", { event: "trip_share_revoked" }, () => {
            terminal = true;
            setConnection("revoked");
            void supabase.removeChannel(channel);
          })
          .on("broadcast", { event: "trip_share_completed" }, () => {
            terminal = true;
            setTrip((current) =>
              current
                ? {
                    ...current,
                    snapshot: {
                      ...current.snapshot,
                      status: "completed",
                      completedAt: new Date().toISOString(),
                    },
                  }
                : current,
            );
            void supabase.removeChannel(channel);
          })
          .subscribe((status) => {
            if (disposed) return;
            if (status === "SUBSCRIBED") setConnection("live");
            if (
              (!terminal && status === "CHANNEL_ERROR") ||
              (!terminal && (status === "TIMED_OUT" || status === "CLOSED"))
            ) {
              setConnection("reconnecting");
            }
          });
      } catch (error) {
        console.log("error", error);
        console.log("error");
        if (!disposed) setConnection("invalid");
      }
    };

    void run();
    return () => {
      disposed = true;
      if (expiryTimer) clearTimeout(expiryTimer);
      if (channel) void supabaseBrowser().removeChannel(channel);
    };
  }, [locale, refreshSnapshot]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setClockTick((value) => value + 1),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const status = useMemo(() => {
    if (!trip) return "";
    const waypoint =
      trip.waypoints[trip.snapshot.currentWaypointIndex] ??
      trip.waypoints.at(-1);
    switch (trip.snapshot.status) {
      case "inside_alert_radius":
        return copy.arriving(trip.identity.displayName);
      case "alarming":
        return copy.arrived(
          trip.identity.displayName,
          waypoint?.name ?? copy.destination,
        );
      case "completed":
        return copy.completed;
      case "cancelled":
        return copy.cancelled;
      default:
        return copy.onTheWay(trip.identity.displayName);
    }
  }, [copy, trip]);

  const subscribe = async () => {
    if (!trip) return;
    setPushState("subscribing");
    try {
      await subscribeToArrival(trip.shareId, locale);
      await saveShareUrl(trip.shareId, window.location.href);
      setPushState("enabled");
    } catch {
      setPushState("denied");
    }
  };

  if (connection === "preparing") {
    return <StateScreen title={copy.preparing} loading />;
  }
  if (
    connection === "invalid" ||
    connection === "expired" ||
    connection === "revoked" ||
    !trip
  ) {
    return (
      <StateScreen
        title={copy.invalidTitle}
        body={copy.invalidBody}
        footer={
          <div className="legal-links">
            <Link href="/privacidad">{copy.privacy}</Link>
            <Link href="/terminos">{copy.terms}</Link>
          </div>
        }
      />
    );
  }

  const waypoint =
    trip.waypoints[trip.snapshot.currentWaypointIndex] ?? trip.waypoints.at(-1);
  if (!waypoint) {
    return <StateScreen title={copy.invalidTitle} body={copy.invalidBody} />;
  }
  const lastUpdated = lastUpdatedLabel(
    trip.snapshot.latestLocation?.capturedAt,
    copy,
    clockTick,
  );
  const isIosBrowser =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !window.matchMedia("(display-mode: standalone)").matches;
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
  const originLabel = shortPlaceName(trip.origin.address);
  const isLive = connection === "live";

  return (
    <main className="viewer-shell">
      <section
        className={`viewer-layout${sheetOpen ? " is-sheet-open" : ""}`}
        aria-live="polite"
      >
        <div className="viewer-map-column">
          <div className="map-panel">
            <div className="map-heading">
              <span className="map-heading-title">
                <MapPinned aria-hidden="true" size={18} />
                {copy.mapTitle}
              </span>
              <span className={`live-pill ${isLive ? "" : "muted"}`}>
                <span className="live-dot" aria-hidden="true" />
                {isLive ? copy.live : copy.reconnecting}
              </span>
            </div>
            {!trip.snapshot.latestLocation && (
              <p className="map-waiting">{copy.noLocation}</p>
            )}
            <TripMap
              trip={trip}
              route={route}
              recenterRequest={recenterRequest}
              recenterLabel={copy.recenter}
              layoutTick={sheetOpen ? 1 : 0}
              onRecenter={() => setRecenterRequest((value) => value + 1)}
            />
          </div>
        </div>

        <TripBottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          expandLabel={copy.sheetExpand}
          collapseLabel={copy.sheetCollapse}
          summary={
            <>
              <Avatar
                name={trip.identity.displayName}
                url={trip.identity.avatarUrl}
              />
              <div className="sheet-summary-copy">
                <p className="eyebrow">
                  <span
                    className={`live-dot ${isLive ? "" : "muted"}`}
                    aria-hidden="true"
                  />
                  {isLive ? copy.live : copy.reconnecting}
                </p>
                <strong>{status}</strong>
                <span>
                  {etaMinutes != null
                    ? copy.arrivingIn(etaMinutes)
                    : `${copy.lastUpdate}: ${lastUpdated}`}
                </span>
              </div>
            </>
          }
        >
          <div className="progress-card">
            <div className="progress-card-head">
              <h2>{copy.tripInProgress}</h2>
              <span
                className={`status-pill ${tripActive ? "is-active" : "is-done"}`}
              >
                <span className="status-pill-dot" aria-hidden="true" />
                {tripActive ? copy.activeStatus : status}
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
                  <strong>{status}</strong>
                  <span className="timeline-accent">
                    {etaMinutes != null
                      ? copy.arrivingIn(etaMinutes)
                      : lastUpdated}
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
                    {shortPlaceName(waypoint.address ?? waypoint.name)}
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
            <Avatar
              name={trip.identity.displayName}
              url={trip.identity.avatarUrl}
            />
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
                disabled={pushState === "subscribing" || isIosBrowser}
                onClick={subscribe}
              >
                <Bell aria-hidden="true" size={20} />
                {pushState === "denied" ? copy.notifyDenied : copy.notify}
              </button>
            ))}
          {showArrivalPush && isIosBrowser && (
            <p className="ios-note">{copy.iosInstall}</p>
          )}

          <footer className="viewer-footer">
            <BrandLockup />
            <div className="legal-links">
              <Link href="/privacidad">{copy.privacy}</Link>
              <span aria-hidden="true">·</span>
              <Link href="/terminos">{copy.terms}</Link>
            </div>
          </footer>
        </TripBottomSheet>
      </section>
    </main>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // Avatar remoto validado por el contrato; no se procesa con Next/Image.
      // biome-ignore lint/performance/noImgElement: dynamic third-party avatar
      <img className="avatar" src={url} alt="" referrerPolicy="no-referrer" />
    );
  }
  return (
    <div className="avatar avatar-fallback" aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

function BrandLockup() {
  return (
    <span className="brand-lockup">
      <span className="brand-lockup-mark" aria-hidden="true">
        T
      </span>
      tranka
    </span>
  );
}

function StateScreen({
  title,
  body,
  loading = false,
  footer,
}: {
  title: string;
  body?: string;
  loading?: boolean;
  footer?: ReactNode;
}) {
  return (
    <main className="simple-page">
      <section className="simple-card" aria-live="polite">
        <div className="brand-mark" aria-hidden="true">
          T
        </div>
        {loading && <div className="soft-spinner" aria-hidden="true" />}
        <h1>{title}</h1>
        {body && <p>{body}</p>}
        {footer}
      </section>
    </main>
  );
}

function lastUpdatedLabel(
  capturedAt: string | null | undefined,
  copy: ReturnType<typeof copyFor>,
  _clockTick: number,
) {
  if (!capturedAt) return "—";
  const minutes = Math.floor((Date.now() - Date.parse(capturedAt)) / 60_000);
  return minutes < 1 ? copy.now : copy.minutesAgo(minutes);
}

function shortPlaceName(address: string) {
  return address.split(",")[0]?.trim() || address;
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
