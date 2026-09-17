"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocode } from "@/lib/googleMaps";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export interface UserLocation {
latitude: number;
longitude: number;
address: string;
}

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const MOVEMENT_THRESHOLD_METERS = 50;

// Accept a new GPS fix if its accuracy improves
// by at least this amount.
const ACCURACY_IMPROVEMENT_METERS = 20;

// --------------------------------------------------
// DISTANCE CALCULATION
// --------------------------------------------------

function getDistanceInMeters(
latitude1: number,
longitude1: number,
latitude2: number,
longitude2: number
): number {
const earthRadius = 6371000;

const latitudeDifference =
((latitude2 - latitude1) * Math.PI) / 180;

const longitudeDifference =
((longitude2 - longitude1) * Math.PI) / 180;

const a =
Math.sin(latitudeDifference / 2) ** 2 +
Math.cos((latitude1 * Math.PI) / 180) *
Math.cos((latitude2 * Math.PI) / 180) *
Math.sin(longitudeDifference / 2) ** 2;

const c =
2 *
Math.atan2(
Math.sqrt(a),
Math.sqrt(1 - a)
);

return earthRadius * c;
}

// --------------------------------------------------
// HOOK
// --------------------------------------------------

export function useLocation() {
// ==================================================
// STATE
// ==================================================

const [location, setLocation] =
useState<UserLocation | null>(null);

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState<string | null>(null);

// ==================================================
// REFS
// ==================================================

// Last GPS fix that was accepted by the application.
const previousLocation = useRef<{
latitude: number;
longitude: number;
accuracy: number;
} | null>(null);

// ID returned by navigator.geolocation.watchPosition().
const watchId = useRef<number | null>(null);

// Prevent multiple watchers from being created.
const watcherActive = useRef(false);

// Prevent multiple reverse-geocoding requests
// from happening simultaneously.
const reverseGeocodeInProgress = useRef(false);

// ==================================================
// STOP WATCHING LOCATION
// ==================================================

const stopWatchingLocation = useCallback(() => {
if (watchId.current !== null) {
navigator.geolocation.clearWatch(
watchId.current
);


  watchId.current = null;
}

watcherActive.current = false;


}, []);

// ==================================================
// START WATCHING LOCATION
// ==================================================

const startWatchingLocation = useCallback(() => {
// ----------------------------------------------
// Browser support
// ----------------------------------------------


if (!navigator.geolocation) {
  setError(
    "Location services are not supported by this browser."
  );

  setLoading(false);

  return;
}

// ----------------------------------------------
// Prevent duplicate watchers
// ----------------------------------------------

if (watcherActive.current) {
  return;
}

watcherActive.current = true;

setLoading(true);
setError(null);

// ----------------------------------------------
// Start GPS watcher
// ----------------------------------------------

watchId.current =
  navigator.geolocation.watchPosition(
    async (position) => {
      try {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        // Useful during testing.
        console.log(
          "GPS update:",
          {
            latitude,
            longitude,
            accuracy,
          }
        );

        // ==================================================
        // CHECK WHETHER THIS FIX IS MEANINGFUL
        // ==================================================

        const previous =
          previousLocation.current;

        if (previous) {
          const distance =
            getDistanceInMeters(
              previous.latitude,
              previous.longitude,
              latitude,
              longitude
            );

          const accuracyImproved =
            accuracy <
            previous.accuracy -
              ACCURACY_IMPROVEMENT_METERS;

          const movedEnough =
            distance >=
            MOVEMENT_THRESHOLD_METERS;

          // Ignore tiny GPS changes unless the new
          // reading is substantially more accurate.
          if (
            !movedEnough &&
            !accuracyImproved
          ) {
            return;
          }
        }

        // ==================================================
        // PREVENT DUPLICATE REVERSE GEOCODING
        // ==================================================

        if (
          reverseGeocodeInProgress.current
        ) {
          return;
        }

        reverseGeocodeInProgress.current = true;

        // ==================================================
        // REVERSE GEOCODE
        // ==================================================

        const data =
          await reverseGeocode(
            latitude,
            longitude
          );

        // ==================================================
        // SAVE ACCEPTED GPS FIX
        // ==================================================

        previousLocation.current = {
          latitude,
          longitude,
          accuracy,
        };

        // ==================================================
        // UPDATE LOCATION
        // ==================================================

        setLocation({
          latitude,
          longitude,
          address: data.address,
        });

        setError(null);
      } catch (error) {
        console.error(
          "Location update failed:",
          error
        );

        setError(
          "Unable to determine your current location."
        );
      } finally {
        reverseGeocodeInProgress.current = false;
        setLoading(false);
      }
    },

    // ==================================================
    // GPS ERROR
    // ==================================================

    (error) => {
      console.error(
        "Geolocation error:",
        error
      );

      setError(
        "Unable to access your current location."
      );

      setLoading(false);
    },

    // ==================================================
    // GPS OPTIONS
    // ==================================================

    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }
  );


}, []);

// ==================================================
// START LOCATION WATCHER
// ==================================================

useEffect(() => {
startWatchingLocation();


return () => {
  stopWatchingLocation();
};


}, [
startWatchingLocation,
stopWatchingLocation,
]);

// ==================================================
// APP VISIBILITY
// ==================================================

useEffect(() => {
function handleVisibilityChange() {
// ----------------------------------------------
// App went into background
// ----------------------------------------------


  if (
    document.visibilityState === "hidden"
  ) {
    console.log(
      "App backgrounded — stopping GPS watcher."
    );

    stopWatchingLocation();

    return;
  }

  // ----------------------------------------------
  // App became active again
  // ----------------------------------------------

  if (
    document.visibilityState === "visible"
  ) {
    console.log(
      "App active — starting GPS watcher."
    );

    startWatchingLocation();
  }
}

document.addEventListener(
  "visibilitychange",
  handleVisibilityChange
);

return () => {
  document.removeEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
};


}, [
startWatchingLocation,
stopWatchingLocation,
]);

// ==================================================
// RETURN
// ==================================================

return {
location,
loading,
error,
};
}
