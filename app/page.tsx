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

  const [calculationError, setCalculationError] =
    useState<string | null>(null);

  const [hasCalculated, setHasCalculated] =
    useState(false);

  const [destination, setDestination] =
    useState<PlaceSuggestion | null>(null);

  const [arrivalTime, setArrivalTime] =
    useState("");

  const [arrivalDate, setArrivalDate] =
    useState("");

  const [leaveTime, setLeaveTime] =
    useState("");

  const [estimatedArrivalTime, setEstimatedArrivalTime] =
    useState("");

  const [mode, setMode] =
    useState<"arrive" | "leaveNow">("arrive");

  const [routeInfo, setRouteInfo] = useState({
    travelMinutes: 0,
    distanceKm: 0,
    trafficDelay: 0,
  });

  const resultRef =
    useRef<HTMLDivElement | null>(null);

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
    // ==================================================
    // BASIC VALIDATION
    // ==================================================

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

    // ==================================================
    // CREATE GOOGLE TIMESTAMP
    // ==================================================

    let departureTime: string;

    if (mode === "leaveNow") {
      /*
        LEAVE NOW

        Always create a completely fresh timestamp.

        Example:

        2026-08-30T21:35:42.123Z

        This contains:

        Year
        Month
        Day
        Hour
        Minute
        Second
        Milliseconds
        Timezone
      */

      const now = new Date();

      departureTime =
        now.toISOString();

      console.log(
        "LEAVE NOW timestamp:",
        departureTime
      );
    } else {
      // ==================================================
      // ARRIVE BY VALIDATION
      // ==================================================

      if (!arrivalDate || !arrivalTime) {
        setCalculationError(
          "Please select an arrival date and time."
        );

        return;
      }

      // --------------------------------------------------
      // PARSE DATE
      // --------------------------------------------------

      const dateParts =
        arrivalDate.split("-");

      if (dateParts.length !== 3) {
        setCalculationError(
          "The selected arrival date is invalid."
        );

        return;
      }

      const year =
        Number(dateParts[0]);

      const month =
        Number(dateParts[1]);

      const day =
        Number(dateParts[2]);

      // --------------------------------------------------
      // PARSE TIME
      // --------------------------------------------------

      const timeParts =
        arrivalTime.split(":");

      if (timeParts.length !== 2) {
        setCalculationError(
          "The selected arrival time is invalid."
        );

        return;
      }

      const hours =
        Number(timeParts[0]);

      const minutes =
        Number(timeParts[1]);

      // --------------------------------------------------
      // VALIDATE NUMBERS
      // --------------------------------------------------

      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
      ) {
        setCalculationError(
          "The selected arrival date or time is invalid."
        );

        return;
      }

      // --------------------------------------------------
      // CREATE DATE
      // --------------------------------------------------

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

      // --------------------------------------------------
      // MAKE SURE JAVASCRIPT ACCEPTED THE DATE
      // --------------------------------------------------

      if (
        Number.isNaN(
          requestedArrival.getTime()
        )
      ) {
        setCalculationError(
          "The selected arrival date or time is invalid."
        );

        return;
      }

      // --------------------------------------------------
      // CHECK PAST TIME
      // --------------------------------------------------

      const now =
        new Date();

      if (
        requestedArrival <= now
      ) {
        setCalculationError(
          "That arrival time has already passed. Please choose a future date and time."
        );

        return;
      }

      // --------------------------------------------------
      // CONVERT TO GOOGLE TIMESTAMP
      // --------------------------------------------------

      departureTime =
        requestedArrival.toISOString();

      console.log(
        "ARRIVE BY timestamp:",
        departureTime
      );
    }

    // ==================================================
    // CLEAR PREVIOUS STATE
    // ==================================================

    setCalculationError(null);

    setLeaveTime("");

    setEstimatedArrivalTime("");

    // ==================================================
    // SEND ROUTE REQUEST
    // ==================================================

    try {
      console.log(
        "Sending departureTime to API:",
        departureTime
      );

      const response =
        await fetch(
          "/api/routes",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              origin: {
                latitude:
                  location.latitude,

                longitude:
                  location.longitude,
              },

              destinationPlaceId:
                destination.placeId,

              departureTime:
                departureTime,
            }),
          }
        );

      // ==================================================
      // HTTP ERROR
      // ==================================================

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        console.error(
          "Route API error:",
          errorData
        );

        setCalculationError(
          "We couldn't calculate your route right now. Please try again."
        );

        return;
      }

      // ==================================================
      // READ RESPONSE
      // ==================================================

      const data =
        await response.json();

      console.log(
        "Route API response:",
        data
      );

      // ==================================================
      // VALIDATE RESPONSE
      // ==================================================

      if (
        !data.duration ||
        !data.staticDuration
      ) {
        console.error(
          "Invalid route response:",
          data
        );

        setCalculationError(
          "Google couldn't calculate a route for this request."
        );

        return;
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      setHasCalculated(true);

      hasCalculatedRef.current =
        true;

      // ==================================================
      // TRAVEL TIME
      // ==================================================

      const trafficSeconds =
        Number(
          String(
            data.duration
          ).replace("s", "")
        );

      const normalSeconds =
        Number(
          String(
            data.staticDuration
          ).replace("s", "")
        );

      const trafficMinutes =
        Math.ceil(
          trafficSeconds / 60
        );

      const normalMinutes =
        Math.ceil(
          normalSeconds / 60
        );

      // ==================================================
      // TRAFFIC DELAY
      // ==================================================

      const trafficDelay =
        trafficMinutes -
        normalMinutes;

      // ==================================================
      // TOTAL TRAVEL TIME
      // ==================================================

      const totalMinutes =
        trafficMinutes;

      // ==================================================
      // RESULT
      // ==================================================

      if (mode === "arrive") {
        // ------------------------------------------------
        // ARRIVE BY
        // ------------------------------------------------

        const arrival =
          new Date(
            `${arrivalDate}T${arrivalTime}:00`
          );

        if (
          Number.isNaN(
            arrival.getTime()
          )
        ) {
          setCalculationError(
            "The selected arrival date or time is invalid."
          );

          return;
        }

        const leave =
          new Date(
            arrival.getTime() -
              totalMinutes * 60000
          );

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
        // ------------------------------------------------
        // LEAVE NOW
        // ------------------------------------------------

        /*
          Use the SAME timestamp that was
          sent to Google.

          This prevents the result from being
          calculated using a different second.
        */

        const now =
          new Date(
            departureTime
          );

        if (
          Number.isNaN(
            now.getTime()
          )
        ) {
          setCalculationError(
            "The current time could not be determined."
          );

          return;
        }

        const estimatedArrival =
          new Date(
            now.getTime() +
              totalMinutes * 60000
          );

        const formattedArrival =
          estimatedArrival.toLocaleTimeString(
            [],
            {
              hour: "numeric",
              minute: "2-digit",
            }
          );

        setEstimatedArrivalTime(
          formattedArrival
        );

        setLeaveTime(
          "Now"
        );
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
              data.distanceMeters /
              1000
            ).toFixed(1)
          ),

        trafficDelay:
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
    } catch (error) {
      console.error(
        "Route calculation failed:",
        error
      );

      setCalculationError(
        "Something went wrong while calculating your route. Please try again."
      );
    }
  }

  // ==================================================
  // LIVE LOCATION UPDATE
  // ==================================================

  useEffect(() => {
    if (!hasCalculatedRef.current) {
      return;
    }

    if (!location) {
      return;
    }

    calculateLeaveTime();
  }, [location]);

  // ==================================================
  // PAGE UI
  // ==================================================

  return (
    <main>
      <div className="mx-auto max-w-xl space-y-4 p-6">

        {/* HEADER */}

        <Header />

        {/* CURRENT LOCATION */}

        <CurrentLocationCard
          location={location}
          loading={loading}
          error={error}
        />

        {/* DESTINATION */}

        <DestinationCard
          onSelect={(place) => {
            setDestination(place);
          }}
        />

        {/* ARRIVAL / LEAVE NOW */}

        <ArrivalTimeCard
          value={arrivalTime}
          onChange={setArrivalTime}
          mode={mode}
          onModeChange={setMode}
          onDateChange={setArrivalDate}
        />

        {/* CALCULATE */}

        <CalculateButton
          onClick={
            calculateLeaveTime
          }
        />

        {/* ERROR */}

        {calculationError && (
          <Toast
            message={
              calculationError
            }
            onClose={() =>
              setCalculationError(
                null
              )
            }
          />
        )}

        {/* RESULT */}

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
