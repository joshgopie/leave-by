"use client";

import {
  MapPin,
  Clock,
  Navigation,
  Car,
  AlertTriangle,
} from "lucide-react";

import type { PlaceSuggestion } from "@/types/places";

interface Props {
  mode: "arrive" | "leaveNow";

  leaveTime: string;

  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;

  destination: PlaceSuggestion | null;

  arrivalTime: string;

  routeInfo: {
    travelMinutes: number;
    distanceKm: number;
    trafficDelay: number;
    description: string;
  };
}

export default function ResultCard({
  mode,
  leaveTime,
  location,
  destination,
  arrivalTime,
  routeInfo,
}: Props) {
  const traffic =
    routeInfo.trafficDelay >= 15
      ? { label: "Heavy traffic", icon: "🔴" }
      : routeInfo.trafficDelay >= 5
        ? { label: "Moderate traffic", icon: "🟡" }
        : { label: "Traffic looks good", icon: "🟢" };

  const resultTime =
    mode === "arrive" ? leaveTime : arrivalTime;

  const handleWazeNavigation = () => {
    if (!destination) return;

    const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(
      destination.fullText
    )}&navigate=yes`;

    window.location.href = wazeUrl;
  };

  return (
    <div className="space-y-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">

      {/* RESULT */}
      <div className="space-y-1 text-center">
        <p className="text-sm text-zinc-400">
          {mode === "arrive"
            ? "You should leave"
            : "Estimated arrival"}
        </p>

        <h2 className="text-5xl font-bold tracking-tight">
          {resultTime}
        </h2>

        {mode === "arrive" && (
          <p className="text-sm text-zinc-400">
            Arrive by {arrivalTime}
          </p>
        )}
      </div>

      {/* ROUTE */}
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">

        {/* FROM */}
        <div className="flex items-start gap-3">
          <MapPin
            size={18}
            className="mt-1 shrink-0 text-blue-200/50"
          />

          <div className="min-w-0">
            <p className="text-xs text-zinc-500">
              From
            </p>

            <p className="truncate font-medium">
              {location?.address ?? "Current location"}
            </p>
          </div>
        </div>

        {/* VIA */}
        <div className="flex items-start gap-3">
          <Car
            size={18}
            className="mt-1 shrink-0 text-blue-200/50"
          />

          <div className="min-w-0">
            <p className="text-xs text-zinc-500">
              Via
            </p>

            <p className="text-sm leading-relaxed text-zinc-300">
              {routeInfo.description || "Route unavailable"}
            </p>
          </div>
        </div>

        {/* TO */}
        <div className="flex items-start gap-3">
          <MapPin
            size={18}
            className="mt-1 shrink-0 text-blue-200/50"
          />

          <div className="min-w-0">
            <p className="text-xs text-zinc-500">
              To
            </p>

            <p className="font-medium">
              {destination?.fullText?.replace(
                /, Trinidad and Tobago$/,
                ""
              ) || "Destination"}
            </p>
          </div>
        </div>

      </div>

      {/* TRIP INFO */}
      <div className="grid grid-cols-2 gap-3">

        {/* TRAVEL TIME */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <Clock
            size={18}
            className="mb-2 text-blue-200/50"
          />

          <p className="text-xs text-zinc-500">
            Travel time
          </p>

          <p className="font-semibold">
            {routeInfo.travelMinutes} min
          </p>
        </div>

        {/* DISTANCE */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <Navigation
            size={18}
            className="mb-2 text-blue-200/50"
          />

          <p className="text-xs text-zinc-500">
            Distance
          </p>

          <p className="font-semibold">
            {routeInfo.distanceKm} km
          </p>
        </div>

      </div>

      {/* TRAFFIC */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">

        <AlertTriangle
          size={18}
          className="shrink-0 text-yellow-400"
        />

        <div>
          <p className="font-medium">
            {traffic.icon} {traffic.label}
          </p>

          <p className="text-sm text-zinc-400">
            {routeInfo.trafficDelay > 0
              ? `+${routeInfo.trafficDelay} min delay`
              : "No major delays"}
          </p>
        </div>

      </div>

      {/* WAZE */}
      <button
        type="button"
        onClick={handleWazeNavigation}
        disabled={!destination}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Car size={20} />
        Navigate with Waze
      </button>

    </div>
  );
}