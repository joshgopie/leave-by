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

  function formatTime(time: string) {

    if (!time) return "";

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }


  function getTrafficStatus() {

    if (routeInfo.trafficDelay >= 15) {

      return {
        label: "Heavy traffic",
        message:
          `+${routeInfo.trafficDelay} minutes delay`,
        icon: "🔴",
      };
    }


    if (routeInfo.trafficDelay >= 5) {

      return {
        label: "Moderate traffic",
        message:
          `+${routeInfo.trafficDelay} minutes delay`,
        icon: "🟡",
      };
    }


    return {
      label: "Traffic looks good",
      message:
        "No major delays",
      icon: "🟢",
    };
  }


  const trafficStatus =
    getTrafficStatus();


  return (

    <div
      className="
        rounded-2xl
        border border-zinc-800
        bg-zinc-950
        p-5
        space-y-5
        shadow-xl
      "
    >

      {/* Header */}

      <div className="flex items-center gap-3">

        <div
          className="
            rounded-2xl
            bg-blue-500/20
            p-3
          "
        >

          <Car
            size={24}
            className="text-blue-400"
          />

        </div>


        <div>

          <p className="text-sm text-zinc-400">

            {mode === "arrive"
              ? "Recommend departure"
              : "Estimated arrival"}

          </p>


          <h2 className="text-3xl font-bold">

            {mode === "arrive"
              ? leaveTime
              : formatTime(arrivalTime)}

          </h2>

        </div>

      </div>


      {/* Route Details */}

      <div className="space-y-4">


        {/* From */}

        <div className="flex gap-3">

          <MapPin
            size={18}
            className="
              text-green-400
              mt-1
              shrink-0
            "
          />


          <div>

            <p className="text-sm text-zinc-400">
              From
            </p>


            <p className="font-medium">

              {
                location?.address ??
                "Current location"
              }

            </p>

          </div>

        </div>


        {/* Destination */}

        <div className="flex gap-3">

          <MapPin
            size={18}
            className="
              text-blue-400
              mt-1
              shrink-0
            "
          />


          <div>

            <p className="text-sm text-zinc-400">
              To
            </p>


            <p className="font-medium">

              {
                destination?.fullText?.replace(
                  /, Trinidad and Tobago$/,
                  ""
                ) ||
                "Destination"
              }

            </p>

          </div>

        </div>


        {/* Travel Time */}

        <div className="flex gap-3">

          <Clock
            size={18}
            className="
              text-yellow-400
              mt-1
              shrink-0
            "
          />


          <div>

            <p className="text-sm text-zinc-400">
              Travel time
            </p>


            <p className="font-medium">

              {routeInfo.travelMinutes}
              {" "}
              minutes

            </p>

          </div>

        </div>


        {/* Distance */}

        <div className="flex gap-3">

          <Navigation
            size={18}
            className="
              text-purple-400
              mt-1
              shrink-0
            "
          />


          <div>

            <p className="text-sm text-zinc-400">
              Distance
            </p>


            <p className="font-medium">

              {routeInfo.distanceKm}
              {" "}
              km

            </p>

          </div>

        </div>


        {/* Traffic */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-xl
            bg-zinc-900
            border border-zinc-800
            p-3
          "
        >

          <AlertTriangle
            size={18}
            className="text-yellow-400"
          />


          <div>

            <p className="font-medium">

              {trafficStatus.icon}
              {" "}
              {trafficStatus.label}

            </p>


            <p className="text-sm text-zinc-400">

              {trafficStatus.message}

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}