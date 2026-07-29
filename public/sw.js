const DATABASE_NAME = "tranka-trip-links";
const STORE_NAME = "links";

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Tranka", {
      body: payload.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `trip-arrival:${payload.shareId}:${payload.waypointIndex}`,
      renotify: false,
      data: { shareId: payload.shareId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = await readShareUrl(event.notification.data?.shareId);
      if (!url) return;
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});

function readShareUrl(shareId) {
  if (!shareId) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(STORE_NAME, "readonly");
      const get = transaction.objectStore(STORE_NAME).get(shareId);
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror = () => resolve(null);
      transaction.oncomplete = () => database.close();
    };
  });
}
