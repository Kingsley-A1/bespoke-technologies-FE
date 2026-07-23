"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((registration) => {
        window.addEventListener("online", () => registration.update());
      }).catch(() => {
        // SW registration failed silently — app still works
      });
    }
  }, []);

  return null;
}
