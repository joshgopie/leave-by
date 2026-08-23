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
    (latitude2 - latitude1) *
    Math.PI /
    180;

  const longitudeDifference =
    (longitude2 - longitude1) *
    Math.PI /
    180;

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(latitude1 * Math.PI / 180) *
    Math.cos(latitude2 * Math.PI / 180) *
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

  // Stores the last location that was considered
  // meaningful enough to update the application.
  const previousCoordinates = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Prevents multiple GPS requests from running
  // at the same time.
  const requestInProgress = useRef(false);


  // ==================================================
  // REFRESH LOCATION
  // ==================================================

  const refreshLocation = useCallback(() => {

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
    // Prevent duplicate requests
    // ----------------------------------------------

    if (requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;

    setLoading(true);
    setError(null);


    // ----------------------------------------------
    // Get current GPS position
    // ----------------------------------------------

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        try {

          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;


          // ==================================================
          // CHECK FOR MEANINGFUL MOVEMENT
          // ==================================================

          if (previousCoordinates.current) {

            const distance =
              getDistanceInMeters(
                previousCoordinates.current.latitude,
                previousCoordinates.current.longitude,
                latitude,
                longitude
              );


            // ----------------------------------------------
            // Ignore insignificant GPS movement
            // ----------------------------------------------

            if (
              distance <
              MOVEMENT_THRESHOLD_METERS
            ) {

              return;
            }
          }


          // ==================================================
          // REVERSE GEOCODE
          // ==================================================

          const data =
            await reverseGeocode(
              latitude,
              longitude
            );


          // ==================================================
          // SAVE NEW COORDINATES
          // ==================================================

          previousCoordinates.current = {
            latitude,
            longitude,
          };


          // ==================================================
          // UPDATE LOCATION
          // ==================================================

          setLocation({
            latitude,
            longitude,
            address: data.address,
          });

        } catch (error) {

          console.error(
            "Location refresh failed:",
            error
          );

          setError(
            "Unable to determine your current location."
          );

        } finally {

          requestInProgress.current = false;

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

        requestInProgress.current = false;

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
  // INITIAL LOCATION
  // ==================================================

  useEffect(() => {

    refreshLocation();

  }, [refreshLocation]);


  // ==================================================
  // REFRESH WHEN APP BECOMES ACTIVE
  // ==================================================

  useEffect(() => {

    function handleVisibilityChange() {

      if (
        document.visibilityState === "visible"
      ) {

        refreshLocation();
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

  }, [refreshLocation]);


  // ==================================================
  // RETURN
  // ==================================================

  return {
    location,
    loading,
    error,
  };
}