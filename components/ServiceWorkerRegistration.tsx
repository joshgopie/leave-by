"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => {
          console.log("Service worker registered");
        })
        .catch((error) => {
          console.error("Service worker failed:", error);
        });
    }
  }, []);

  return null;
}