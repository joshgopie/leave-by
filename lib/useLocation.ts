"use client";

import { useEffect, useState } from "react";
import { reverseGeocode } from "./googleMaps";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

const STORAGE_KEY = "leave-by-location";

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cached location immediately
    const cached = localStorage.getItem(STORAGE_KEY);

    if (cached) {
      try {
        const parsed: LocationData = JSON.parse(cached);
        setLocation(parsed);
        setLoading(false);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const data = await reverseGeocode(latitude, longitude);

          const freshLocation = {
            latitude,
            longitude,
            address: data.address,
          };

          setLocation(freshLocation);

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(freshLocation)
          );
        } catch {
          const freshLocation = {
            latitude,
            longitude,
          };

          setLocation(freshLocation);

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(freshLocation)
          );
        }

        setLoading(false);
      },

      () => {
        if (!cached) {
          setError("Unable to get location");
        }

        setLoading(false);
      },

      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  }, []);

  return {
    location,
    loading,
    error,
  };
}