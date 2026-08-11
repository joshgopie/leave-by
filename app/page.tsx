"use client";

import { useRef, useState } from "react";

// Components
import Header from "@/components/Header";
import CurrentLocationCard from "@/components/CurrentLocationCard";
import DestinationCard from "@/components/DestinationCard";
import ArrivalTimeCard from "@/components/ArrivalTimeCard";
import CalculateButton from "@/components/CalculateButton";
import ResultCard from "@/components/ResultCard";

// Types & Hooks
import type { PlaceSuggestion } from "@/types/places";
import { useLocation } from "@/lib/useLocation";

export default function Home() {
  // --------------------------------------------------
  // APP STATE
  // --------------------------------------------------

  // The destination selected by the user
  const [destination, setDestination] =
    useState<PlaceSuggestion | null>(null);

  // The time the user wants to arrive
  const [arrivalTime, setArrivalTime] = useState("");

  // The calculated time the user should leave
  const [leaveTime, setLeaveTime] = useState("");

  // The estimated arrival time when using Leave Now mode
  const [estimatedArrivalTime, setEstimatedArrivalTime] =
    useState("");

  // The current calculation mode.
  // "arrive" = user chooses an arrival time
  // "leaveNow" = user wants to leave immediately
  const [mode, setMode] =
    useState<"arrive" | "leaveNow">("arrive");

  // Information returned from Google Routes
  const [routeInfo, setRouteInfo] = useState({
    travelMinutes: 0,
    distanceKm: 0,
    trafficDelay: 0,
  });

  // Used to automatically scroll to the result
  const resultRef = useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // CURRENT LOCATION
  // --------------------------------------------------

  const {
    location,
    loading,
    error,
  } = useLocation();

  // --------------------------------------------------
  // CALCULATE ROUTE
  // --------------------------------------------------

  async function calculateLeaveTime() {
    // We need a location and destination
    // for both modes.
    if (!location || !destination) {
      return;
    }

    // Clear previous results
    setLeaveTime("");
    setEstimatedArrivalTime("");

    // Ask our Next.js API route for the route information.
    const response = await fetch("/api/routes", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        origin: {
          latitude: location.latitude,
          longitude: location.longitude,
        },

        destinationPlaceId:
          destination.placeId,
      }),
    });

    // Convert Google's response into JSON.
    const data = await response.json();

    console.log("Route:", data);

    // Make sure Google returned the information we need.
    if (!data.duration || !data.staticDuration) {
      console.error("Invalid route response");
      return;
    }

    // --------------------------------------------------
    // CALCULATE TRAVEL TIME
    // --------------------------------------------------

    // Google returns duration as something like:
    // "1800s"
    const trafficSeconds =
      Number(data.duration.replace("s", ""));

    const normalSeconds =
      Number(data.staticDuration.replace("s", ""));

    // Convert seconds into minutes.
    const trafficMinutes =
      Math.ceil(trafficSeconds / 60);

    const normalMinutes =
      Math.ceil(normalSeconds / 60);

    // How much additional time traffic is adding.
    const trafficDelay =
      trafficMinutes - normalMinutes;

    // Add our 10-minute safety buffer.
    const totalMinutes =
      trafficMinutes + 5;

    // --------------------------------------------------
    // CALCULATE RESULT BASED ON MODE
    // --------------------------------------------------

    if (mode === "arrive") {
      // ----------------------------------------------
      // ARRIVE BY
      // ----------------------------------------------

      const [hours, minutes] =
        arrivalTime.split(":");

      // Create a Date object using today's date
      // and the arrival time selected by the user.
      const arrival = new Date();

      arrival.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );

      // Subtract the travel time + safety buffer.
      const leave = new Date(
        arrival.getTime() -
          totalMinutes * 60000
      );

      // Convert the result into a normal time
      // such as "3:25 PM".
      const formattedLeave =
        leave.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });

      // Save recommended departure time.
      setLeaveTime(formattedLeave);

    } else {
      // ----------------------------------------------
      // LEAVE NOW
      // ----------------------------------------------

      // Get the current time.
      const now = new Date();

      // Add travel time + safety buffer.
      const estimatedArrival =
        new Date(
          now.getTime() +
            totalMinutes * 60000
        );

      // Save the estimated arrival time
      // in 24-hour format.
      setEstimatedArrivalTime(
        `${estimatedArrival
          .getHours()
          .toString()
          .padStart(2, "0")}:${estimatedArrival
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );

      // There is no departure time because
      // the user is leaving now.
      setLeaveTime("Now");
    }

    // --------------------------------------------------
    // SAVE ROUTE INFORMATION
    // --------------------------------------------------

    setRouteInfo({
      travelMinutes: trafficMinutes,

      distanceKm: Number(
        (data.distanceMeters / 1000).toFixed(1)
      ),

      trafficDelay,
    });

    // --------------------------------------------------
    // SCROLL TO RESULT
    // --------------------------------------------------

    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <main>
      <div className="mx-auto max-w-xl space-y-4 p-6">

        {/* App header */}
        <Header />

        {/* Current GPS location */}
        <CurrentLocationCard
          location={location}
          loading={loading}
          error={error}
        />

        {/* Destination search */}
        <DestinationCard
          onSelect={(place) => {
            setDestination(place);
          }}
        />

        {/* Arrival / Leave Now mode */}
        <ArrivalTimeCard
          value={arrivalTime}
          onChange={setArrivalTime}
          mode={mode}
          onModeChange={setMode}
        />

        {/* Calculate button */}
        <CalculateButton
          onClick={calculateLeaveTime}
        />

        {/* Result */}
        {leaveTime && (
          <div ref={resultRef}>

            <ResultCard
              mode={mode}
              leaveTime={leaveTime}
              location={location}
              destination={destination}
              arrivalTime={
                mode === "arrive"
                  ? arrivalTime
                  : estimatedArrivalTime
              }
              routeInfo={routeInfo}
            />

          </div>
        )}

      </div>
    </main>
  );
}