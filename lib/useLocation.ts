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
  accuracy?: number;
}

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const LOCATION_STORAGE_KEY = "leave-by-location";

const MOVEMENT_THRESHOLD_METERS = 50;

// Accept a new GPS fix if its accuracy improves
// by at least this amount.
//const ACCURACY_IMPROVEMENT_METERS = 20;

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
// CACHE HELPERS
// --------------------------------------------------

function getCachedLocation(): UserLocation | null {
  try {
    const cached =
      localStorage.getItem(
        LOCATION_STORAGE_KEY
      );

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    if (
      typeof parsed?.latitude !== "number" ||
      typeof parsed?.longitude !== "number" ||
      typeof parsed?.address !== "string"
    ) {
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      address: parsed.address,
      accuracy:
        typeof parsed.accuracy === "number"
          ? parsed.accuracy
          : undefined,
    };
  } catch (error) {
    console.error(
      "Failed to load cached location:",
      error
    );

    return null;
  }
}

function saveCachedLocation(
  location: UserLocation
) {
  try {
    localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(location)
    );
  } catch (error) {
    console.error(
      "Failed to save cached location:",
      error
    );
  }
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

  // Last GPS location accepted by the application.
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
  // from running simultaneously.
  const reverseGeocodeInProgress = useRef(false);

  // ==================================================
  // LOAD CACHED LOCATION
  // ==================================================

  useEffect(() => {
    const cachedLocation =
      getCachedLocation();

    if (cachedLocation) {
      // Show the cached location immediately.
      setLocation(cachedLocation);

      // The user already has a usable location,
      // so don't show the loading state while
      // waiting for a new GPS fix.
      setLoading(false);

      // Use the cached location as the baseline
      // for deciding whether the device has moved.
      previousLocation.current = {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        accuracy:
          cachedLocation.accuracy ??
          Number.POSITIVE_INFINITY,
      };
    }
  }, []);

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

    // Only show loading if we don't already have
    // a cached location displayed.
    setLocation((current) => {
      if (!current) {
        setLoading(true);
      }

      return current;
    });

    setError(null);

    // ----------------------------------------------
    // Start GPS watcher
    // ----------------------------------------------

    watchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const accuracy =
            position.coords.accuracy;

          // ==================================================
          // FIRST GPS FIX
          // ==================================================

          const previous =
            previousLocation.current;

          // If there is no previous location,
          // this is the first usable GPS fix.
          if (!previous) {
            previousLocation.current = {
              latitude,
              longitude,
              accuracy,
            };

            const initialLocation: UserLocation = {
              latitude,
              longitude,
              address: "",
              accuracy,
            };

            setLocation(initialLocation);
            setLoading(false);
            setError(null);

            // We have no cached address, so we need
            // to reverse-geocode this first location.
            if (
              !reverseGeocodeInProgress.current
            ) {
              reverseGeocodeInProgress.current =
                true;

              void (async () => {
                try {
                  const data =
                    await reverseGeocode(
                      latitude,
                      longitude
                    );

                  const updatedLocation: UserLocation = {
                    latitude,
                    longitude,
                    address: data.address,
                    accuracy,
                  };

                  setLocation(
                    updatedLocation
                  );

                  saveCachedLocation(
                    updatedLocation
                  );
                } catch (error) {
                  console.error(
                    "Reverse geocoding failed:",
                    error
                  );

                  // The GPS location is still valid,
                  // even if the address lookup fails.
                  saveCachedLocation(
                    initialLocation
                  );
                } finally {
                  reverseGeocodeInProgress.current =
                    false;
                }
              })();
            }

            return;
          }

          // ==================================================
          // CHECK WHETHER LOCATION HAS CHANGED ENOUGH
          // ==================================================

          const distance =
            getDistanceInMeters(
              previous.latitude,
              previous.longitude,
              latitude,
              longitude
            );

          /* const accuracyImproved =
            accuracy <
            previous.accuracy -
              ACCURACY_IMPROVEMENT_METERS;*/

          const movedEnough =
            distance >=
            MOVEMENT_THRESHOLD_METERS;

          /* // Ignore small GPS changes unless the
          // new reading is substantially more accurate.
          if (
            !movedEnough &&
            !accuracyImproved
          ) {
            return;
          } */

          // ==================================================
          // ACCEPT THE NEW GPS FIX
          // ==================================================

          previousLocation.current = {
            latitude,
            longitude,
            accuracy,
          };

          setError(null);
          setLoading(false);

          // ==================================================
          // REVERSE GEOCODE ONLY WHEN NECESSARY
          // ==================================================

          if (
            reverseGeocodeInProgress.current
          ) {
            return;
          }

          reverseGeocodeInProgress.current =
            true;

          void (async () => {
            try {
              const data =
                await reverseGeocode(
                  latitude,
                  longitude
                );

              const updatedLocation: UserLocation = {
                latitude,
                longitude,
                address: data.address,
                accuracy,
              };

              setLocation(
                updatedLocation
              );

              saveCachedLocation(
                updatedLocation
              );
            } catch (error) {
              console.error(
                "Reverse geocoding failed:",
                error
              );
            } finally {
              reverseGeocodeInProgress.current =
                false;
            }
          })();
        },

        // ==================================================
        // GPS ERROR
        // ==================================================

        (error) => {
          console.error(
            "Geolocation error:",
            error
          );

          // The current location can no longer be confirmed.
          // Remove the cached location so we don't display
          // a stale location.
          localStorage.removeItem(
            LOCATION_STORAGE_KEY
          );

          previousLocation.current = null;

          setLocation(null);

          setError(
            "Unable to determine your current location."
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
        stopWatchingLocation();

        return;
      }

      // ----------------------------------------------
      // App became active again
      // ----------------------------------------------

      if (
        document.visibilityState === "visible"
      ) {
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