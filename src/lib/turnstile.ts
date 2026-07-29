"use client";

declare global {
  interface Window {
    turnstile?: {
      render(element: HTMLElement, options: Record<string, unknown>): string;
      execute(widgetId: string): void;
      remove(widgetId: string): void;
    };
  }
}

let scriptPromise: Promise<void> | undefined;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile unavailable"));
    document.head.append(script);
  });
  return scriptPromise;
}

export async function requestTurnstileToken(): Promise<string | undefined> {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!sitekey) return undefined;
  await loadScript();

  return new Promise((resolve, reject) => {
    const host = document.createElement("div");
    host.className = "turnstile-host";
    host.setAttribute("aria-label", "Security check");
    document.body.append(host);
    let widgetId = "";
    const clean = () => {
      if (widgetId) window.turnstile?.remove(widgetId);
      host.remove();
    };
    widgetId =
      window.turnstile?.render(host, {
        sitekey,
        size: "invisible",
        execution: "execute",
        callback: (token: string) => {
          clean();
          resolve(token);
        },
        "error-callback": () => {
          clean();
          reject(new Error("Turnstile failed"));
        },
        "timeout-callback": () => {
          clean();
          reject(new Error("Turnstile timed out"));
        },
      }) ?? "";
    if (!widgetId) {
      clean();
      reject(new Error("Turnstile unavailable"));
      return;
    }
    window.turnstile?.execute(widgetId);
  });
}
