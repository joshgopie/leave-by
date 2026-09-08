"use client";

import { useEffect, useRef, useState } from "react";

import Header from "@/components/Header";
import CurrentLocationCard from "@/components/CurrentLocationCard";
import DestinationCard from "@/components/DestinationCard";
import ArrivalTimeCard from "@/components/ArrivalTimeCard";
import ResultCard from "@/components/ResultCard";
import Toast from "@/components/ui/toast";

import type { PlaceSuggestion } from "@/types/places";
import { useLocation } from "@/lib/useLocation";

export default function Home() {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const [destination, setDestination] =
    useState<PlaceSuggestion | null>(null);

  const [arrivalTime, setArrivalTime] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");

  const [mode, setMode] = useState<"arrive" | "leaveNow">("arrive");

  const [lastArriveBy, setLastArriveBy] = useState<{
    arrivalDate: string;
    arrivalTime: string;
    leaveTime: string;
    routeInfo: {
      travelMinutes: number;
      distanceKm: number;
      trafficDelay: number;
      description: string;
    };
  } | null>(null);

  const [routeInfo, setRouteInfo] = useState({
    travelMinutes: 0,
    distanceKm: 0,
    trafficDelay: 0,
    description: "",
  });

  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasCalculatedRef = useRef(false);

  // --------------------------------------------------
  // CURRENT LOCATION
  // --------------------------------------------------

  const { location, loading, error } = useLocation();

  // --------------------------------------------------
  // CALCULATE ROUTE
  // --------------------------------------------------

  async function calculateLeaveTime(
    calculationMode: "arrive" | "leaveNow" = mode,
    values?: {
      arrivalDate?: string;
      arrivalTime?: string;
    }
  ) {
    if (!location) {
      setCalculationError(
        "We can't calculate your route because your current location is unavailable."
      );
      return;
    }

    if (!destination) {
      setCalculationError("Please select a destination.");
      return;
    }

    // --------------------------------------------------
    // USE FRESH VALUES FROM ARRIVAL TIME CARD
    // --------------------------------------------------

    const selectedArrivalDate =
      values?.arrivalDate ?? arrivalDate;

    const selectedArrivalTime =
      values?.arrivalTime ?? arrivalTime;

    // --------------------------------------------------
    // CREATE DEPARTURE TIMESTAMP
    // --------------------------------------------------

    let departureTime: string;

    if (calculationMode === "leaveNow") {
      departureTime = new Date().toISOString();
    } else {
      if (!selectedArrivalDate || !selectedArrivalTime) {
        setCalculationError(
          "Please select an arrival date and time."
        );
        return;
      }

      const dateParts = selectedArrivalDate.split("-");
      const timeParts = selectedArrivalTime.split(":");

      if (dateParts.length !== 3) {
        setCalculationError(
          "The selected arrival date is invalid."
        );
        return;
      }

      if (timeParts.length !== 2) {
        setCalculationError(
          "The selected arrival time is invalid."
        );
        return;
      }

      const year = Number(dateParts[0]);
      const month = Number(dateParts[1]);
      const day = Number(dateParts[2]);

      const hours = Number(timeParts[0]);
      const minutes = Number(timeParts[1]);

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

      const requestedArrival = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0
      );

      if (Number.isNaN(requestedArrival.getTime())) {
        setCalculationError(
          "The selected arrival date or time is invalid."
        );
        return;
      }

      if (requestedArrival <= new Date()) {
        setCalculationError(
          "That arrival time has already passed. Please choose a future date and time."
        );
        return;
      }

      departureTime = requestedArrival.toISOString();
    }

    // --------------------------------------------------
    // RESET PREVIOUS RESULT
    // --------------------------------------------------

    setCalculationError(null);
    setLeaveTime("");
    setEstimatedArrivalTime("");

    // --------------------------------------------------
    // CALL ROUTE API
    // --------------------------------------------------

    try {
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
          destinationPlaceId: destination.placeId,
          departureTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        console.error("Route API error:", errorData);

        setCalculationError(
          "We couldn't calculate your route right now. Please try again."
        );

        return;
      }

      const data = await response.json();

      // --------------------------------------------------
      // VALIDATE GOOGLE RESPONSE
      // --------------------------------------------------

      if (!data.duration || !data.staticDuration) {
        console.error("Invalid route response:", data);

        setCalculationError(
          "Google couldn't calculate a route for this request."
        );

        return;
      }

      // --------------------------------------------------
      // CALCULATE TRAVEL TIME
      // --------------------------------------------------

      const trafficSeconds = Number(
        String(data.duration).replace("s", "")
      );

      const normalSeconds = Number(
        String(data.staticDuration).replace("s", "")
      );

      const trafficMinutes = Math.ceil(
        trafficSeconds / 60
      );

      const normalMinutes = Math.ceil(
        normalSeconds / 60
      );

      const trafficDelay = Math.max(
        0,
        trafficMinutes - normalMinutes
      );

      // --------------------------------------------------
      // CALCULATE RESULT
      // --------------------------------------------------

      if (calculationMode === "arrive") {
        const arrival = new Date(
          `${selectedArrivalDate}T${selectedArrivalTime}:00`
        );

        if (Number.isNaN(arrival.getTime())) {
          setCalculationError(
            "The selected arrival date or time is invalid."
          );
          return;
        }

        const leave = new Date(
          arrival.getTime() -
            trafficMinutes * 60000
        );

        const calculatedLeaveTime =
          leave.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });

        setLeaveTime(calculatedLeaveTime);

        setLastArriveBy({
          arrivalDate: selectedArrivalDate,
          arrivalTime: selectedArrivalTime,
          leaveTime: calculatedLeaveTime,
          routeInfo: {
            travelMinutes: trafficMinutes,
            distanceKm: Number(
              (data.distanceMeters / 1000).toFixed(1)
            ),
            trafficDelay,
            description: data.description ?? "",
          },
        });
      } else {
        const now = new Date(departureTime);

        if (Number.isNaN(now.getTime())) {
          setCalculationError(
            "The current time could not be determined."
          );
          return;
        }

        const estimatedArrival = new Date(
          now.getTime() +
            trafficMinutes * 60000
        );

        setEstimatedArrivalTime(
          estimatedArrival.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        );

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
        description: data.description ?? "",
      });

      setHasCalculated(true);
      hasCalculatedRef.current = true;

      // --------------------------------------------------
      // SCROLL TO RESULT
      // --------------------------------------------------

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

  // --------------------------------------------------
  // UPDATE ROUTE WHEN LOCATION CHANGES
  // --------------------------------------------------

  useEffect(() => {
    if (!hasCalculatedRef.current || !location) {
      return;
    }

    calculateLeaveTime();
  }, [location]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main>
      <div
        className="mx-auto max-w-xl space-y-4 px-6 pb-6"
        style={{
          paddingTop:
            "calc(env(safe-area-inset-top) + 1.5rem)",
          paddingBottom:
            "calc(env(safe-area-inset-bottom) + 1.5rem)",
        }}
      >
        <Header />

        <CurrentLocationCard
          location={location}
          loading={loading}
          error={error}
        />

        {calculationError && (
          <Toast
            message={calculationError}
            onClose={() =>
              setCalculationError(null)
            }
          />
        )}

        <DestinationCard
          onSelect={(place) =>
            setDestination(place)
          }
        />

        <ArrivalTimeCard
            value={arrivalTime}
            onChange={setArrivalTime}
            mode={mode}
            onModeChange={(newMode) => {
              setMode(newMode);

              if (newMode === "arrive" && lastArriveBy) {
                setArrivalDate(lastArriveBy.arrivalDate);
                setArrivalTime(lastArriveBy.arrivalTime);
                setLeaveTime(lastArriveBy.leaveTime);
                setRouteInfo(lastArriveBy.routeInfo);
                setEstimatedArrivalTime("");
                setHasCalculated(true);
              }
            }}
            onDateChange={setArrivalDate}
            onCalculate={calculateLeaveTime}
        />

        {hasCalculated && leaveTime && (
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

