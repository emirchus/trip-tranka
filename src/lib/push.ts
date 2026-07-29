"use client";

import type { TrankaLocale } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase";

const databaseName = "tranka-trip-links";
const storeName = "links";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function saveShareUrl(shareId: string, url: string) {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(url, shareId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function subscribeToArrival(
  shareId: string,
  locale: TrankaLocale,
) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("Push is not configured");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission denied");
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(vapidKey),
    }));
  const json = subscription.toJSON();
  const { error } = await supabaseBrowser().functions.invoke(
    "trip-share-push-subscription",
    {
      body: {
        action: "subscribe",
        shareId,
        locale,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
        },
      },
    },
  );
  if (error) throw error;
}
