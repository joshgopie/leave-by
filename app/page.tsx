"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

// --------------------------------------------------
// COMPONENTS
// --------------------------------------------------

import Header from "@/components/Header";
import CurrentLocationCard from "@/components/CurrentLocationCard";
import DestinationCard from "@/components/DestinationCard";
import ArrivalTimeCard from "@/components/ArrivalTimeCard";
import CalculateButton from "@/components/CalculateButton";
import ResultCard from "@/components/ResultCard";
import Toast from "@/components/ui/toast";

// --------------------------------------------------
// TYPES & HOOKS
// --------------------------------------------------

import type { PlaceSuggestion } from "@/types/places";
import { useLocation } from "@/lib/useLocation";

// --------------------------------------------------
// PAGE
// --------------------------------------------------

export default function Home() {

  // ==================================================
  // APP STATE
  // ==================================================

  // Error message shown to the user
  const [calculationError, setCalculationError] =
    useState<string | null>(null);

  // Whether the user has successfully calculated
  // a route at least once
  const [hasCalculated, setHasCalculated] =
    useState(false);

  // Destination selected by the user
  const [destination, setDestination] =
    useState<PlaceSuggestion | null>(null);

  // User's desired arrival time
  const [arrivalTime, setArrivalTime] =
    useState("");
  // User's desired arrival time
  const [arrivalDate, setArrivalDate] =
  useState("");

  // Recommended departure time
  const [leaveTime, setLeaveTime] =
    useState("");

  // Estimated arrival time for Leave Now mode
  const [estimatedArrivalTime, setEstimatedArrivalTime] =
    useState("");

  // Current calculation mode
  const [mode, setMode] =
    useState<"arrive" | "leaveNow">("arrive");

  // Information returned from Google Routes
  const [routeInfo, setRouteInfo] = useState({
    travelMinutes: 0,
    distanceKm: 0,
    trafficDelay: 0,
  });

  // Used to scroll to the result
  const resultRef =
    useRef<HTMLDivElement | null>(null);

  // Used to remember whether a route
  // has already been calculated
  const hasCalculatedRef =
    useRef(false);


  // ==================================================
  // CURRENT LOCATION
  // ==================================================

  const {
    location,
    loading,
    error,
  } = useLocation();


  // ==================================================
  // CALCULATE ROUTE
  // ==================================================

  async function calculateLeaveTime() {

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

    if (!location) {

      setCalculationError(
        "We can't calculate your route because your current location is unavailable."
      );

      return;
    }

    if (!destination) {

      setCalculationError(
        "Please select a destination."
      );

      return;
    }

    if (mode === "arrive") {
      if (!arrivalDate || !arrivalTime) {
        setCalculationError(
          "Please select an arrival date and time."
        );

      return;
      }
    }


  const [year, month, day] =
  arrivalDate.split("-").map(Number);

  const [hours, minutes] =
    arrivalTime.split(":").map(Number);

  const requestedArrival =
    new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0
    );

  const now = new Date();

  if (requestedArrival <= now) {

    setCalculationError(
      "That arrival time has already passed. Please choose a future date and time."
    );

    return;
  }


    // Clear previous error
    setCalculationError(null);

    // Clear previous results
    setLeaveTime("");
    setEstimatedArrivalTime("");


    // ----------------------------------------------
    // REQUEST ROUTE FROM OUR API
    // ----------------------------------------------

  const arrivalDateTime =
    `${arrivalDate}T${arrivalTime}:00-04:00`;

    const response = await fetch(
      "/api/routes",
      {
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

          departureTime:
            arrivalDateTime
        }),
      }
    );


    // ----------------------------------------------
    // READ API RESPONSE
    // ----------------------------------------------

    const data =
      await response.json();


    // ----------------------------------------------
    // VALIDATE ROUTE RESPONSE
    // ----------------------------------------------

    if (
      !data.duration ||
      !data.staticDuration
    ) {

      console.error(
        "Invalid route response"
      );

      return;
    }


    // A successful route now exists
    setHasCalculated(true);

    // Remember that we have calculated
    hasCalculatedRef.current = true;


    // ==================================================
    // TRAVEL TIME
    // ==================================================

    // Google returns durations like:
    // "1800s"

    const trafficSeconds =
      Number(
        data.duration.replace("s", "")
      );

    const normalSeconds =
      Number(
        data.staticDuration.replace("s", "")
      );


    // Convert seconds to minutes

    const trafficMinutes =
      Math.ceil(
        trafficSeconds / 60
      );

    const normalMinutes =
      Math.ceil(
        normalSeconds / 60
      );


    // Calculate traffic delay

    const trafficDelay =
      trafficMinutes - normalMinutes;


    // ==================================================
    // TOTAL TRAVEL TIME
    // ==================================================

    const totalMinutes =
      trafficMinutes;


    // ==================================================
    // CALCULATE RESULT
    // ==================================================

    if (mode === "arrive") {

      // ----------------------------------------------
      // ARRIVE BY MODE
      // ----------------------------------------------

      const [hours, minutes] =
        arrivalTime.split(":");


      const arrival =
        new Date();


      arrival.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );


      // Subtract travel time

      const leave =
        new Date(
          arrival.getTime() -
          totalMinutes * 60000
        );


      // Format departure time

      const formattedLeave =
        leave.toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit",
          }
        );


      setLeaveTime(
        formattedLeave
      );

    } else {

      // ----------------------------------------------
      // LEAVE NOW MODE
      // ----------------------------------------------

      const now =
        new Date();


      const estimatedArrival =
        new Date(
          now.getTime() +
          totalMinutes * 60000
        );


      // Format estimated arrival

      setEstimatedArrivalTime(
        `${estimatedArrival
          .getHours()
          .toString()
          .padStart(2, "0")}:${estimatedArrival
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );


      // User is leaving now

      setLeaveTime("Now");
    }


    // ==================================================
    // SAVE ROUTE INFORMATION
    // ==================================================

    setRouteInfo({

      travelMinutes:
        trafficMinutes,

      distanceKm:
        Number(
          (
            data.distanceMeters / 1000
          ).toFixed(1)
        ),

      trafficDelay,
    });


    // ==================================================
    // SCROLL TO RESULT
    // ==================================================

    setTimeout(() => {

      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

    }, 100);
  }


  // ==================================================
  // LIVE LOCATION UPDATE
  // ==================================================

  useEffect(() => {

    // Don't do anything until the user
    // has calculated a route.

    if (!hasCalculatedRef.current) {
      return;
    }


    // Don't calculate if location isn't available

    if (!location) {
      return;
    }


    // Recalculate the route using
    // the new location

    calculateLeaveTime();

  }, [location]);


  // ==================================================
  // PAGE UI
  // ==================================================

  return (

    <main>

      <div className="mx-auto max-w-xl space-y-4 p-6">

        {/* Header */}

        <Header />


        {/* Current location */}

        <CurrentLocationCard
          location={location}
          loading={loading}
          error={error}
        />


        {/* Destination */}

        <DestinationCard
          onSelect={(place) => {
            setDestination(place);
          }}
        />


        {/* Arrival / Leave Now */}

        <ArrivalTimeCard
          value={arrivalTime}
          onChange={setArrivalTime}
          mode={mode}
          onModeChange={setMode}
          onDateChange={setArrivalDate}
        />


        {/* Calculate */}

        <CalculateButton
          onClick={calculateLeaveTime}
        />


        {/* Error notification */}

        {calculationError && (

          <Toast
            message={calculationError}
            onClose={() =>
              setCalculationError(null)
            }
          />

        )}


        {/* Results */}

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