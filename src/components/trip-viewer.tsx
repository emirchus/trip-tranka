"use client";

import { Bell, Circle, MapPin, Route, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  return (
    <main className="viewer-shell">
      <section className="viewer-card" aria-live="polite">
        <header className="identity-row">
          <Avatar
            name={trip.identity.displayName}
            url={trip.identity.avatarUrl}
          />
          <div className="identity-copy">
            <p className="eyebrow">
              <span
                className={`live-dot ${connection === "live" ? "" : "muted"}`}
                aria-hidden="true"
              />
              {connection === "live" ? copy.live : copy.reconnecting}
            </p>
            <h1>{status}</h1>
            <p className="subtle">
              {copy.lastUpdate}: {lastUpdated}
            </p>
          </div>
        </header>

        <div className="journey-grid">
          <div>
            <MapPin aria-hidden="true" size={20} />
            <span>
              <small>{copy.origin}</small>
              <strong>{trip.origin.address}</strong>
            </span>
          </div>
          <div>
            <Circle aria-hidden="true" size={20} />
            <span>
              <small>{copy.destination}</small>
              <strong>{waypoint.address ?? waypoint.name}</strong>
            </span>
          </div>
        </div>

        <div className="map-heading">
          <span>
            <Route aria-hidden="true" size={20} />
            {copy.route}
          </span>
          {!trip.snapshot.latestLocation && <small>{copy.noLocation}</small>}
        </div>
        <TripMap
          trip={trip}
          route={route}
          recenterRequest={recenterRequest}
          recenterLabel={copy.recenter}
          onRecenter={() => setRecenterRequest((value) => value + 1)}
        />

        <div className="notice">
          <ShieldCheck aria-hidden="true" size={20} />
          <p>{copy.liveDisclaimer}</p>
        </div>

        {pushState === "enabled" ? (
          <p className="push-success">
            <Bell aria-hidden="true" size={18} />
            {copy.notifyEnabled}
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
        )}
        {isIosBrowser && <p className="ios-note">{copy.iosInstall}</p>}

        <footer className="viewer-footer">
          <span>Tranka</span>
          <div className="legal-links">
            <Link href="/privacidad">{copy.privacy}</Link>
            <Link href="/terminos">{copy.terms}</Link>
          </div>
        </footer>
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
